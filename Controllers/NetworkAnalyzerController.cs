
namespace NetworkAnalyzer.Controllers
{
    using NetworkAnalyzer.Core.Analyzers;
    using Microsoft.AspNetCore.Mvc;
    using Newtonsoft.Json;
    using PcapDotNet.Core;
    using System.Collections.Concurrent;

    [ApiController]
    [Route("[controller]")]
    public class NetworkAnalyzerController : ControllerBase
    {
        private readonly TimeSpan LiveCaptureKillAfterIdleTime = TimeSpan.FromSeconds(10);

        private readonly ILogger<NetworkAnalyzerController> _logger;

        private static readonly string PcapUploadPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "PcapUpload");

        private static readonly ConcurrentDictionary<string, (DateTime Timestamp, LivePacketAnalyzer Analyzer)> _liveCaptureIdToPacketAnalyzer = new ConcurrentDictionary<string, (DateTime, LivePacketAnalyzer)>();

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
                        var runningLiveCaptures = _liveCaptureIdToPacketAnalyzer.ToList();
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

                OfflinePacketAnalyzer packetAnalyzer = new OfflinePacketAnalyzer(filePath);
                string graphJson = await packetAnalyzer.GetCytoscapeGraphJson();

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
        public IActionResult StartLivePacketCapture(string nicDesc)
        {
            var nics = LivePacketDevice.AllLocalMachine
                .Select(availableNic => availableNic.Description)
                .FirstOrDefault(availableNicDesc => availableNicDesc.Equals(nicDesc, StringComparison.OrdinalIgnoreCase));

            if (nics == null)
            {
                return StatusCode(404, $"Network card wasn't found: {nicDesc}");
            }

            var liveCaptureGuid = Guid.NewGuid();
            var livePacketAnalyzer = new LivePacketAnalyzer(nicDesc);
            _liveCaptureIdToPacketAnalyzer[liveCaptureGuid.ToString()] = (DateTime.Now, livePacketAnalyzer);
            Console.WriteLine($"Started live capture ID: {liveCaptureGuid}");
            return Content(liveCaptureGuid.ToString());
        }

        [HttpGet("live/data")]
        public async Task<IActionResult> GetLivePacketCaptureData(string liveCaptureId)
        {
            // TODO: throw + exception handler middleware
            if (!_liveCaptureIdToPacketAnalyzer.TryGetValue(liveCaptureId, out var liveCapture))
            {
                return StatusCode(404, $"Live capture with ID '{liveCaptureId}' wasn't found.");
            }

            // Refresh idle time before calculation
            var timeRefreshedCaptureData = (DateTime.Now, liveCapture.Analyzer);
            _liveCaptureIdToPacketAnalyzer.TryUpdate(liveCaptureId, timeRefreshedCaptureData, liveCapture);
            var networkInfoJson = await liveCapture.Analyzer.GetCytoscapeGraphJson();

            // Refresh idle time also after calculation
            _liveCaptureIdToPacketAnalyzer.TryUpdate(liveCaptureId, (DateTime.Now, liveCapture.Analyzer), timeRefreshedCaptureData);

            return Content(networkInfoJson);
        }

        [HttpPost("live/stop")]
        public async Task<IActionResult> StopLivePacketCapture(string liveCaptureId)
        {
            // TODO: throw + exception handler middleware
            if (!_liveCaptureIdToPacketAnalyzer.TryGetValue(liveCaptureId, out _))
            {
                return StatusCode(404, $"Live capture with ID '{liveCaptureId}' wasn't found.");
            }

            await DisposeLivePacketCapture(liveCaptureId);
            return Ok();
        }

        [HttpGet("nics")]
        public IActionResult GetAvailableNICs()
        {
            var nics = LivePacketDevice.AllLocalMachine;
            return Content(JsonConvert.SerializeObject(nics.Select(nic => nic.Description)));
        }


        private static async Task DisposeLivePacketCapture(string liveCaptureId)
        {
            await _liveCaptureIdToPacketAnalyzer[liveCaptureId].Analyzer.DisposeAsync();
            _liveCaptureIdToPacketAnalyzer.Remove(liveCaptureId, out _);
            Console.WriteLine($"Disposed live capture ID: {liveCaptureId}");
        }
    }
}
