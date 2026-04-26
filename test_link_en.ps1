# TravelMaster Microservice Link Test Script

Write-Host "Starting TravelMaster link test..." -ForegroundColor Cyan

$url = "http://localhost:8080/api/travel/itinerary"
$body = @{
    query = "I want to visit Beijing for 3 days, love history and food"
    userId = "test_user_001"
} | ConvertTo-Json

try {
    Write-Host "Sending request to Java Backend ($url)..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS! Response received:" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor Green
    Write-Host "Itinerary Preview:" -ForegroundColor Green
    Write-Host "----------------------------------------"
    if ($response.itinerary.Length -gt 300) {
        Write-Host "$($response.itinerary.Substring(0, 300))..." 
    } else {
        Write-Host $response.itinerary
    }
    Write-Host "----------------------------------------"

} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Python service running on port 8000?"
    Write-Host "2. Java service running on port 8080?"
}
