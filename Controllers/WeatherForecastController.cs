using dotnet_reactjs.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace dotnet_reactjs.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    private readonly ILogger<WeatherForecastController> _logger;

    private static readonly string PcapUploadPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "PcapUpload");

    public WeatherForecastController(ILogger<WeatherForecastController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IEnumerable<WeatherForecast> Get()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }

    [HttpPost]
    [RequestSizeLimit(1_000_000_000)] // 1GB
    [RequestFormLimits(MultipartBodyLengthLimit = 1_000_000_000)] // 1GB
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
            string graphJson = await pcapAnalyzer.Analyze();

            // Delete file
            try
            {
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
}
