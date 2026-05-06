package com.travelmaster.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
public class InternalApiFilter extends OncePerRequestFilter {

    private static final List<String> ALLOWED_IPS = List.of(
            "127.0.0.1",
            "0:0:0:0:0:0:0:1"
    );

    private static final String INTERNAL_API_PATH = "/api/internal/";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestUri = request.getRequestURI();
        if (requestUri.startsWith(INTERNAL_API_PATH)) {
            String clientIp = getClientIp(request);
            if (!isAllowedIp(clientIp)) {
                log.warn("Blocked internal API access from unauthorized IP: {}", clientIp);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"code\": 403, \"message\": \"Access denied: Internal API\"}");
                return;
            }
            log.debug("Allowed internal API access from IP: {}", clientIp);
        }
        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        // Only trust the direct connection IP to prevent header spoofing.
        // If behind a reverse proxy, configure trusted IPs at the network layer.
        return request.getRemoteAddr();
    }

    private boolean isAllowedIp(String ip) {
        return ALLOWED_IPS.contains(ip);
    }
}