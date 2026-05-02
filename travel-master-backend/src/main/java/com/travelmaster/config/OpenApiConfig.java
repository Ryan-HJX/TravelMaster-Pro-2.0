package com.travelmaster.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * SpringDoc OpenAPI 配置类
 * 
 * 功能说明：
 * 1. 配置 API 文档的基本信息（标题、描述、版本等）
 * 2. 配置服务器地址
 * 3. 配置联系信息
 * 
 * 访问方式：
 * - Swagger UI: http://localhost:8080/swagger-ui.html
 * - OpenAPI JSON: http://localhost:8080/v3/api-docs
 * - OpenAPI YAML: http://localhost:8080/v3/api-docs.yaml
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI travelMasterOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TravelMaster Pro API")
                        .description("""
                                TravelMaster Pro 2.0 - 智能旅游社交平台 API 文档
                                
                                ## 核心功能
                                - **用户认证**: JWT Token 认证，支持刷新令牌
                                - **AI 行程规划**: 基于阿里云百炼 + MCP 工具的 9 段式智能规划
                                - **社交互动**: 点赞、评论、收藏、关注
                                - **足迹地图**: 省级行政区可视化
                                - **通知系统**: WebSocket 实时推送
                                - **排行榜**: 热门行程和优质创作者
                                
                                ## 技术栈
                                - Java Spring Boot 3.2
                                - Python FastAPI (AI 服务)
                                - MySQL 8.0 + Redis 7
                                - 阿里云百炼 qwen3 模型
                                - 高德地图 MCP + 盈米金融 MCP
                                
                                ## 认证说明
                                大部分接口需要 JWT Token 认证，请在请求头中添加：
                                ```
                                Authorization: Bearer <your_jwt_token>
                                ```
                                
                                ## 快速开始
                                1. 注册账号: POST /api/auth/register
                                2. 登录获取 Token: POST /api/auth/login
                                3. 使用 Token 调用其他接口
                                """)
                        .version("2.0.0")
                        .contact(new Contact()
                                .name("TravelMaster Team")
                                .url("https://gitee.com/tieguodundadaguai/TravelMaster")
                                .email("support@travelmaster.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("本地开发环境"),
                        new Server()
                                .url("https://api.travelmaster.com")
                                .description("生产环境")
                ));
    }
}
