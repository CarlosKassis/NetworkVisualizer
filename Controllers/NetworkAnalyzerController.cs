using NetworkAnalyzer.Core;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace NetworkAnalyzer.Controllers;

[ApiController]
[Route("[controller]")]
public class NetworkAnalyzerController : ControllerBase
{
    private readonly TimeSpan LiveCaptureKillAfterIdleTime = TimeSpan.FromSeconds(10);

    private readonly ILogger<NetworkAnalyzerController> _logger;

    private static readonly string PcapUploadPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "PcapUpload");

    private static readonly ConcurrentDictionary<string, (DateTime Timestamp, PcapAnalyzer Analyzer)> _liveCaptureIdToPcapAnalyzer = new ConcurrentDictionary<string, (DateTime, PcapAnalyzer)>();

    private static Task _idleCapturesDisposerTask;

    public NetworkAnalyzerController(ILogger<NetworkAnalyzerController> logger)
    {
        _logger = logger;


        if (_idleCapturesDisposerTask == null)
        {
            _idleCapturesDisposerTask = Task.Run(async () =>
            {
                while (true)
                {
                    var runningLiveCaptures = _liveCaptureIdToPcapAnalyzer.ToList();
                    foreach (var liveCapture in runningLiveCaptures)
                    {
                        if (liveCapture.Value.Timestamp + LiveCaptureKillAfterIdleTime <= DateTime.Now)
                        {
                            await DisposeLivePacketCapture(liveCapture.Key);
                        }
                    }

                    await Task.Delay(TimeSpan.FromSeconds(1));
                }
            });
        }
    }

    [HttpGet("offline")]
    [RequestSizeLimit(1_000_000_000)] // ~1GB
    [RequestFormLimits(MultipartBodyLengthLimit = 1_000_000_000)] // ~1GB
    public async Task<IActionResult> UploadFile([FromForm] IFormFile file)
    {
        if (file.Length == 0)
        {
            return BadRequest();
        }

        try
        {
            Directory.CreateDirectory(PcapUploadPath);
            string filePath = Path.Combine(PcapUploadPath, file.FileName);

            // TODO: compare hashes
            if (!System.IO.File.Exists(filePath))
            {
                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }
            }

            PcapAnalyzer pcapAnalyzer = new PcapAnalyzer(filePath);
            string graphJson = await pcapAnalyzer.GenerateCytoscapeGraphJson();

            // Delete file
            try
            {
                // Don't delete for now so that it's saved for next use (save precious SSD write cycles)
                //System.IO.File.Delete(filePath);
            }
            catch
            {
            }

            return Content(graphJson);
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed to write upload file to filesystem", ex);
        }


        return Content("Oops");
    }

    [HttpPost("live/start")]
    public IActionResult StartLivePacketCapture()
    {
        var liveCaptureGuid = Guid.NewGuid();
        if (liveCaptureGuid == null)
        {
            return StatusCode(500, "Failed to generate live capture ID");
        }

        var livePcapAnalyzer = new PcapAnalyzer();
        _liveCaptureIdToPcapAnalyzer[liveCaptureGuid.ToString()] = (DateTime.Now, livePcapAnalyzer);
        Console.WriteLine($"Started live capture ID: {liveCaptureGuid}");
        return Content(liveCaptureGuid.ToString());
    }

    [HttpGet("live/data")]
    public async Task<IActionResult> StartLivePacketCapture(string liveCaptureId)
    {
        // TODO: throw + exception handler middleware
        if (!_liveCaptureIdToPcapAnalyzer.TryGetValue(liveCaptureId, out var liveCapture))
        {
            return StatusCode(404, $"Live capture with ID '{liveCaptureId}' wasn't found.");
        }

        // Refresh idle time before calculation
        var timeRefreshedCaptureData = (DateTime.Now, liveCapture.Analyzer);
        _liveCaptureIdToPcapAnalyzer.TryUpdate(liveCaptureId, timeRefreshedCaptureData, liveCapture);
        var networkInfoJson = await liveCapture.Analyzer.GenerateCytoscapeGraphJson();

        // Refresh idle time also after calculation
        _liveCaptureIdToPcapAnalyzer.TryUpdate(liveCaptureId, (DateTime.Now, liveCapture.Analyzer), timeRefreshedCaptureData);

        return Content(networkInfoJson);
    }

    [HttpPost("live/stop")]
    public async Task<IActionResult> StopLivePacketCapture(string liveCaptureId)
    {
        // TODO: throw + exception handler middleware
        if (!_liveCaptureIdToPcapAnalyzer.TryGetValue(liveCaptureId, out _))
        {
            return StatusCode(404, $"Live capture with ID '{liveCaptureId}' wasn't found.");
        }

        await DisposeLivePacketCapture(liveCaptureId);
        return Ok();
    }

    private static async Task DisposeLivePacketCapture(string liveCaptureId)
    {
        await _liveCaptureIdToPcapAnalyzer[liveCaptureId].Analyzer.DisposeAsync();
        _liveCaptureIdToPcapAnalyzer.Remove(liveCaptureId, out _);
        Console.WriteLine($"Disposed live capture ID: {liveCaptureId}");
    }
}
