package com.example.demo.modules.lessonplan.repository;

import com.example.demo.modules.lessonplan.entity.LessonPlanRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonPlanRecordRepository extends JpaRepository<LessonPlanRecord, Long> {
}
