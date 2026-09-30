package com.mysterymango;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MysteryMangoApplication {
    public static void main(String[] args) { SpringApplication.run(MysteryMangoApplication.class, args); }
}

