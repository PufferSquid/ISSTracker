using System.Net.Http.Json;
using System.Text.Json;


public class ISSService
{
    private readonly HttpClient _httpClient;

    public ISSService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ISSPosition> GetCurrentPosition()
    {
        try
        {
            // Add headers to potentially bypass CORS issues
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "ISS-Tracker");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");


            using (var responseStream = await _httpClient.GetStreamAsync("/v1/satellites/25544"))
            {
                using (JsonDocument doc = await JsonDocument.ParseAsync(responseStream))
                {
                    JsonElement root = doc.RootElement;

                    return new ISSPosition
                    {
                        Latitude = root.GetProperty("latitude").GetDouble(),
                        Longitude = root.GetProperty("longitude").GetDouble(),
                        Altitude = root.GetProperty("altitude").GetDouble(),
                        Velocity = root.GetProperty("velocity").GetDouble(),
                        Timestamp = DateTime.UtcNow
                    };
                }
            }

        }
        catch (Exception ex)
        {
            Console.WriteLine($"API Error: {ex.Message}");
            return new ISSPosition
            {
                Latitude = 0,
                Longitude = 0,
                Altitude = 420,
                Velocity = 27600,
                Timestamp = DateTime.UtcNow
            };
        }
    }
}