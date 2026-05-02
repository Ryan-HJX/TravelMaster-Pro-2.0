package com.travelmaster.contract;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class UserContractTest {

    @LocalServerPort
    private int port;

    private String accessToken;
    private String userId;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost:" + port;
        
        var response = given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "email": "user-contract@example.com",
                    "password": "Password123!",
                    "nickname": "UserTester"
                }
                """)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(200)
            .extract();

        accessToken = response.path("data.accessToken");
        userId = response.path("data.user.userId");
    }

    @Test
    @DisplayName("GET /api/users/profile - should return user profile")
    void getProfile_shouldReturnProfile() {
        given()
            .header("Authorization", "Bearer " + accessToken)
        .when()
            .get("/api/users/profile")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("code", is(200))
            .body("data.userId", equalTo(userId))
            .body("data.email", equalTo("user-contract@example.com"))
            .body("data.nickname", equalTo("UserTester"))
            .body("data.membershipTier", equalTo("STANDARD"));
    }

    @Test
    @DisplayName("PUT /api/users/profile - should update profile")
    void updateProfile_shouldUpdateProfile() {
        given()
            .header("Authorization", "Bearer " + accessToken)
            .contentType(ContentType.JSON)
            .body("""
                {
                    "nickname": "UpdatedNickname",
                    "bio": "Updated bio description",
                    "avatarUrl": "http://example.com/avatar.jpg"
                }
                """)
        .when()
            .put("/api/users/profile")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("code", is(200))
            .body("data.nickname", equalTo("UpdatedNickname"))
            .body("data.bio", equalTo("Updated bio description"))
            .body("data.avatarUrl", equalTo("http://example.com/avatar.jpg"));
    }

    @Test
    @DisplayName("GET /api/users/profile - unauthorized should return 401")
    void getProfile_unauthorized_shouldReturn401() {
        given()
        .when()
            .get("/api/users/profile")
        .then()
            .statusCode(401);
    }

    @Test
    @DisplayName("PUT /api/users/profile - invalid data should return 400")
    void updateProfile_invalidData_shouldReturn400() {
        given()
            .header("Authorization", "Bearer " + accessToken)
            .contentType(ContentType.JSON)
            .body("{}")
        .when()
            .put("/api/users/profile")
        .then()
            .statusCode(400);
    }
}