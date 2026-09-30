package com.mysterymango.auth;
import jakarta.persistence.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="app_user")
public class UserEntity {
    @Id public UUID id;
    @Column(nullable=false,unique=true) public String email;
    @Column(name="display_name",nullable=false) public String displayName;
    @Column(name="password_hash",nullable=false) public String passwordHash;
    @Column(nullable=false) public boolean admin;
    @Column(name="created_at",nullable=false) public Instant createdAt;
    protected UserEntity(){}
    public UserEntity(String email,String displayName,String passwordHash,boolean admin){this.id=UUID.randomUUID();this.email=email;this.displayName=displayName;this.passwordHash=passwordHash;this.admin=admin;this.createdAt=Instant.now();}
}

