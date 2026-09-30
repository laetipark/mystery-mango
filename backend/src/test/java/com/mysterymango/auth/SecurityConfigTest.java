package com.mysterymango.auth;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityConfigTest {
    @Test void configuredUserDetailsUseOnlyApplicationAccounts(){
        UserRepository users=mock(UserRepository.class);
        UserEntity user=new UserEntity("person@example.invalid","person","stored-hash",true);
        when(users.findByEmail(user.email)).thenReturn(Optional.of(user));
        var service=new SecurityConfig().userDetailsService(users);var found=service.loadUserByUsername(" Person@Example.Invalid ");
        assertEquals(user.id.toString(),found.getUsername());assertEquals("stored-hash",found.getPassword());
        assertTrue(found.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN")));
        assertThrows(UsernameNotFoundException.class,()->service.loadUserByUsername("unknown@example.invalid"));
    }
}
