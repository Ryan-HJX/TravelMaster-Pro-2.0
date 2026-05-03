package com.travelmaster.contract;

import com.travelmaster.config.TestRedisConfig;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.DirtiesContext;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestRedisConfig.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuthContractTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost:" + port;
    }

    @Test
    @DisplayName("POST /api/auth/register - should return 200 with tokens and user profile")
    void register_shouldReturnTokenAndUser() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "email": "test-contract@example.com",
                    "password": "Password123!",
                    "nickname": "ContractTester"
                }
                """)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("code", is(200))
            .body("data.accessToken", notNullValue())
            .body("data.refreshToken", notNullValue())
            .body("data.user.userId", notNullValue())
            .body("data.user.email", equalTo("test-contract@example.com"))
            .body("data.user.nickname", equalTo("ContractTester"))
            .body("data.expiresIn", greaterThan(0));
    }

    @Test
    @DisplayName("POST /api/auth/register - duplicate email should return 409")
    void register_duplicateEmail_shouldReturn409() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "email": "duplicate@example.com",
                    "password": "Password123!",
                    "nickname": "FirstUser"
                }
                """)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200);

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "email": "duplicate@example.com",
                    "password": "Password123!",
                    "nickname": "SecondUser"
                }
                """)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(409);
    }

    @Test
    @DisplayName("POST /api/auth/login - valid credentials should return 200 with tokens")
    void login_validCredentials_shouldReturnToken() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "email": "login-test@example.com",
                    "password": "Password123!",
                    "nickname": "LoginTester"
                }
                """)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200);

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "account": "login-test@example.com",
                    "password": "Password123!"
                }
                """)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("code", is(200))
            .body("data.accessToken", notNullValue())
            .body("data.refreshToken", notNullValue())
            .body("data.user.email", equalTo("login-test@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/login - invalid credentials should return 401")
    void login_invalidCredentials_shouldReturn401() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "account": "nonexistent@example.com",
                    "password": "wrongpassword"
                }
                """)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401);
    }

    @Test
    @DisplayName("POST /api/auth/refresh - valid refresh token should return new tokens")
    void refresh_validToken_shouldReturnNewTokens() {
        String refreshToken = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "email": "refresh-test@example.com",
                    "password": "Password123!",
                    "nickname": "RefreshTester"
                }
                """)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .extract()
            .path("data.refreshToken");

        given()
            .contentType(ContentType.JSON)
            .body("{\"refreshToken\": \"" + refreshToken + "\"}")
        .when()
            .post("/api/auth/refresh")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("code", is(200))
            .body("data.accessToken", notNullValue())
            .body("data.refreshToken", notNullValue());
    }

    @Test
    @DisplayName("POST /api/auth/refresh - invalid token should return 401")
    void refresh_invalidToken_shouldReturn401() {
        given()
            .contentType(ContentType.JSON)
            .body("{\"refreshToken\": \"invalid-token-12345\"}")
        .when()
            .post("/api/auth/refresh")
        .then()
            .statusCode(401);
    }
}