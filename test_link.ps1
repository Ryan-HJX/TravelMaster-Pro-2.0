# TravelMaster 微服务链路测试脚本

Write-Host "🚀 开始测试 Java 后端与 Python Agent 的链路连通性..." -ForegroundColor Cyan

# 定义请求地址和数据
$url = "http://localhost:8080/api/travel/itinerary"
$userId = "user_test_123"
$body = @{
    query = "我想去杭州玩两天，喜欢看风景和吃西湖醋鱼"
    userId = $userId
} | ConvertTo-Json

try {
    Write-Host "⏳ 正在向 Java 后端 ($url) 发送请求..." -ForegroundColor Yellow
    
    # 使用 Invoke-WebRequest 获取原始响应内容
    $response = Invoke-WebRequest -Uri $url -Method Post -Body $body -ContentType "application/json; charset=utf-8"
    
    # 强制将内容转换为 UTF-8 字符串
    $jsonContent = [System.Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
    $result = $jsonContent | ConvertFrom-Json
    
    Write-Host "✅ 链路测试成功！收到响应：" -ForegroundColor Green
    Write-Host "状态: $($result.status)" -ForegroundColor Green
    Write-Host "行程单预览:" -ForegroundColor Green
    Write-Host "----------------------------------------"
    # 全部输出作为预览
    
    Write-Host $result.itinerary
    
    Write-Host "----------------------------------------"

    # 测试历史记录接口
    Write-Host "`n📜 正在查询用户的历史行程记录..." -ForegroundColor Cyan
    $historyUrl = "http://localhost:8080/api/travel/history/$userId"
    try {
        $historyResponse = Invoke-WebRequest -Uri $historyUrl -Method Get -UseBasicParsing
        $historyContent = [System.Text.Encoding]::UTF8.GetString($historyResponse.RawContentStream.ToArray())
        $historyList = $historyContent | ConvertFrom-Json
        
        Write-Host "✅ 找到 $($historyList.Count) 条历史行程：" -ForegroundColor Green
        foreach ($item in $historyList) {
            Write-Host "  - ID: $($item.id), 时间: $($item.createdAt)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ 查询历史记录失败: $($_.Exception.Message)" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ 链路测试失败！" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请确认：" -ForegroundColor Yellow
    Write-Host "1. Python 服务是否已在 8000 端口启动 (python server.py)"
    Write-Host "2. Java 后端是否已在 8080 端口启动 (mvn spring-boot:run)"
}
