package com.mysterymango.auth;
import com.mysterymango.common.Json;
import com.mysterymango.realtime.SocketSessions;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.password.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.csrf.*;
import org.springframework.http.HttpMethod;
@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder(12);}
    @Bean UserDetailsService userDetailsService(UserRepository users){return email->{
        var user=users.findByEmail(email.strip().toLowerCase(java.util.Locale.ROOT)).orElseThrow(()->new UsernameNotFoundException("Invalid credentials"));
        return User.withUsername(user.id.toString()).password(user.passwordHash).roles(user.admin?new String[]{"USER","ADMIN"}:new String[]{"USER"}).build();
    };}
    @Bean FilterRegistrationBean<RequestGuard> guardRegistration(RequestGuard guard){var registration=new FilterRegistrationBean<>(guard);registration.setEnabled(false);return registration;}
    @Bean SecurityFilterChain security(HttpSecurity http,Json json,RequestGuard guard,SocketSessions sessions)throws Exception{
        var csrf=new HttpSessionCsrfTokenRepository();
        http.csrf(c->c.csrfTokenRepository(csrf).csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .authorizeHttpRequests(a->a.requestMatchers(HttpMethod.GET,"/api/v1/rooms").permitAll().requestMatchers("/api/v1/auth/csrf","/api/v1/auth/register","/api/v1/auth/login","/api/v1/meta","/api/v1/scenarios/**","/api/openapi/**","/api/docs/**","/api/swagger-ui/**","/swagger-ui/**","/actuator/health").permitAll().requestMatchers("/api/v1/admin/**").hasRole("ADMIN").anyRequest().authenticated())
            .exceptionHandling(e->e.authenticationEntryPoint((req,res,x)->{res.setStatus(401);res.setContentType("application/json;charset=UTF-8");res.getWriter().write(json.write(Json.map("code","LOGIN_REQUIRED","message","로그인이 필요합니다.","traceId",req.getAttribute("traceId"))));}).accessDeniedHandler((req,res,x)->{res.setStatus(403);res.setContentType("application/json;charset=UTF-8");res.getWriter().write(json.write(Json.map("code","FORBIDDEN","message","접근 권한 또는 요청 인증을 확인해 주세요.","traceId",req.getAttribute("traceId"))));}))
            .logout(l->l.logoutUrl("/api/v1/auth/logout").addLogoutHandler((req,res,a)->{var session=req.getSession(false);if(session!=null)sessions.closeHttpSession(session.getId());}).invalidateHttpSession(true).deleteCookies("SESSION").logoutSuccessHandler((req,res,a)->{res.setContentType("application/json");res.getWriter().write("{\"ok\":true}");}))
            .addFilterBefore(guard,CsrfFilter.class);
        return http.build();
    }
}
