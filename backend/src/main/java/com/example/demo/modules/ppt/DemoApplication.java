package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @Bean
    public CommandLineRunner ensureLessonLastModifiedColumn(DataSource dataSource) {
        return args -> {
            try (Connection conn = dataSource.getConnection()) {
                if (!columnExists(conn, "t_lesson", "last_modified")) {
                    try (Statement st = conn.createStatement()) {
                        st.execute("ALTER TABLE t_lesson ADD COLUMN last_modified BIGINT");
                    }
                }
            }
        };
    }

    private static boolean columnExists(Connection conn, String tableName, String columnName) {
        try {
            DatabaseMetaData md = conn.getMetaData();
            if (columnExists(md, tableName, columnName)) return true;
            if (columnExists(md, tableName.toUpperCase(), columnName)) return true;
            if (columnExists(md, tableName, columnName.toUpperCase())) return true;
            return columnExists(md, tableName.toUpperCase(), columnName.toUpperCase());
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean columnExists(DatabaseMetaData md, String tableName, String columnName) {
        try (ResultSet rs = md.getColumns(null, null, tableName, columnName)) {
            return rs.next();
        } catch (Exception e) {
            return false;
        }
    }
}