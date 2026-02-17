package it.project_work.app_arcade.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IndexController {

    @GetMapping ("/api/test")
    public String check() {
        return "IndexController Endpoint";
    }
    
}
