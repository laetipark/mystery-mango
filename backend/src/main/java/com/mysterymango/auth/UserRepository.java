package com.mysterymango.auth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UserRepository extends JpaRepository<UserEntity,UUID>{Optional<UserEntity> findByEmail(String email);}

