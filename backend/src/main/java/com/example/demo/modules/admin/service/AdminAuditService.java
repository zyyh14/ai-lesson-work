package com.example.demo.modules.admin.service;

import com.example.demo.modules.admin.entity.AdminOpLog;
import com.example.demo.modules.admin.repository.AdminOpLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {

    private final AdminOpLogRepository adminOpLogRepository;

    public AdminAuditService(AdminOpLogRepository adminOpLogRepository) {
        this.adminOpLogRepository = adminOpLogRepository;
    }

    public void record(String actor, String action, String targetType, String targetId, String detail, String ip) {
        AdminOpLog log = new AdminOpLog();
        log.setActor(actor == null ? "" : actor);
        log.setAction(action == null ? "" : action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetail(detail);
        log.setIp(ip);
        adminOpLogRepository.save(log);
    }
}
