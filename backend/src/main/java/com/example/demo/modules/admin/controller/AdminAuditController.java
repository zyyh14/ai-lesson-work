package com.example.demo.modules.admin.controller;

import com.example.demo.modules.admin.entity.AdminOpLog;
import com.example.demo.modules.admin.repository.AdminOpLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit")
public class AdminAuditController {

    private final AdminOpLogRepository adminOpLogRepository;

    public AdminAuditController(AdminOpLogRepository adminOpLogRepository) {
        this.adminOpLogRepository = adminOpLogRepository;
    }

    @GetMapping
    public Map<String, Object> listAudit(
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "actor", required = false) String actor,
            @RequestParam(value = "action", required = false) String action
    ) {
        int p = page == null || page < 1 ? 0 : page - 1;
        int l = limit == null || limit < 1 ? 20 : Math.min(limit, 100);

        PageRequest pageable = PageRequest.of(p, l, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<AdminOpLog> logsPage;
        String a = actor == null ? null : actor.trim();
        String act = action == null ? null : action.trim();
        if (a != null && !a.isEmpty()) {
            logsPage = adminOpLogRepository.findByActor(a, pageable);
        } else if (act != null && !act.isEmpty()) {
            logsPage = adminOpLogRepository.findByAction(act, pageable);
        } else {
            logsPage = adminOpLogRepository.findAll(pageable);
        }

        List<Map<String, Object>> logs = logsPage.getContent().stream().map(lg -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", lg.getId());
            item.put("createdAt", lg.getCreatedAt());
            item.put("actor", lg.getActor());
            item.put("action", lg.getAction());
            item.put("targetType", lg.getTargetType());
            item.put("targetId", lg.getTargetId());
            item.put("detail", lg.getDetail());
            item.put("ip", lg.getIp());
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("logs", logs);
        resp.put("total", logsPage.getTotalElements());
        resp.put("page", page == null ? 1 : page);
        resp.put("limit", l);
        return resp;
    }
}
