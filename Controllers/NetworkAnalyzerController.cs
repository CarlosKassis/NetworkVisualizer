using NetworkAnalyzer.Core;
using Microsoft.AspNetCore.Mvc;

namespace NetworkAnalyzer.Controllers;

[ApiController]
[Route("[controller]")]
public class NetworkAnalyzerController : ControllerBase
{
    private readonly ILogger<NetworkAnalyzerController> _logger;

    private static readonly string PcapUploadPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "PcapUpload");

    private static Guid? _liveCaptureGuid;

    public NetworkAnalyzerController(ILogger<NetworkAnalyzerController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
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

    private static PcapAnalyzer? _livePcapAnalyzer;

    [HttpGet("startlive")]
    public IActionResult StartLivePacketCapture()
    {
        _livePcapAnalyzer = new PcapAnalyzer();
        _liveCaptureGuid = Guid.NewGuid();
        if (_liveCaptureGuid == null)
        {
            return StatusCode(500, "Failed to generate capture session ID");
        }

        return Content(_liveCaptureGuid.ToString());
    }

    [HttpGet("tracklive")]
    public async Task<IActionResult> StartLivePacketCapture(string liveCaptureId)
    {
        return Content(await _livePcapAnalyzer?.GenerateCytoscapeGraphJson() ?? "{}");
    }

    [HttpPost("stoplive")]
    public async Task<IActionResult> StopLivePacketCapture(string liveCaptureId)
    {
        await _livePcapAnalyzer?.StopSniffingPackets();
        return Ok();
    }
}
