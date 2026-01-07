package com.example.demo.modules.admin.repository;

import com.example.demo.modules.admin.entity.FeedbackTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackTicketRepository extends JpaRepository<FeedbackTicket, Long> {
    Page<FeedbackTicket> findByStatus(String status, Pageable pageable);
}
