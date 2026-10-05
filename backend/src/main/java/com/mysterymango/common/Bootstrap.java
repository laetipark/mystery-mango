package com.mysterymango.common;
import com.mysterymango.auth.*;
import com.mysterymango.scenario.ScenarioService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
@Component
public class Bootstrap implements ApplicationRunner {
    private final Commands commands;private final Db db;private final Json json;private final ScenarioService scenarios;private final UserRepository users;private final PasswordEncoder encoder;private final Environment env;
    public Bootstrap(Commands commands,Db db,Json json,ScenarioService scenarios,UserRepository users,PasswordEncoder encoder,Environment env){this.commands=commands;this.db=db;this.json=json;this.scenarios=scenarios;this.users=users;this.encoder=encoder;this.env=env;}
    @Override public void run(ApplicationArguments args)throws Exception{
        var resources=new PathMatchingResourcePatternResolver().getResources("classpath:scenarios/*.json");
        for(var resource:resources){var definition=json.object(resource.getContentAsString(StandardCharsets.UTF_8));commands.transaction(()->{if(db.optional("select 1 from scenario where slug=?",definition.get("slug"))==null)scenarios.save(definition,true);return null;});}
        if(!env.matchesProfiles("prod")&&env.matchesProfiles("dev","e2e")){
            String hash=encoder.encode("MangoDev!2026");
            for(int i=0;i<=8;i++){String email=i==0?"admin@example.test":"player"+i+"@example.test";String name=i==0?"관리자":"탐정 "+i;boolean admin=i==0;
                commands.transaction(()->{if(users.findByEmail(email).isEmpty()){var u=users.saveAndFlush(new UserEntity(email,name,hash,admin));db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",u.id);}return null;});
            }
        }
    }
}
