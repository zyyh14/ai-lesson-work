package com.example.demo.modules.lessonplan.service;

import com.example.demo.modules.lessonplan.dto.LessonPlanRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiService {

    private static final String SYSTEM_INSTRUCTION =
            "你是一名资深教研员与一线教师，擅长输出可直接使用的教案。\n" +
            "【统一输出要求】\n" +
            "- 你必须输出【纯 HTML 字符串】，不要 Markdown，不要代码块包裹，不要解释。\n" +
            "- 输出必须从 <table> 或 <div> 开始。\n" +
            "- 所有样式尽量使用 inline CSS（便于导出 Word 保留表格与样式）。\n" +
            "- 默认字体建议：font-family:'SimSun','Songti SC',serif; 适当使用标题/分区/表格。\n\n" +
            "【当提供参照格式图片时】\n" +
            "- 你必须尽最大努力复刻参照格式的表格结构（行列、标题、合并单元格、分区）。\n" +
            "- 表格边框：table/th/td 都使用 border:1px solid #000; border-collapse:collapse;\n" +
            "- 单元格 padding 建议 8-12px，内容可换行。\n" +
            "- 只返回最终 HTML，不要任何前后缀。\n\n" +
            "【当没有参照格式图片时】\n" +
            "- 也必须输出美观的 HTML（不是 Markdown）：\n" +
            "  1) 顶部标题 + 副标题\n" +
            "  2) 课程信息使用 2 列信息表格\n" +
            "  3) 分区用 <h2>：教学目标、重难点、教学准备、教学过程、评价与作业、板书设计（可选）\n" +
            "  4) 适度使用浅灰背景分区块（inline style）提升观感。";

    @Value("${lessonplan.ark.apiKey:}")
    private String apiKey;

    @Value("${lessonplan.ark.model:deepseek-v3-250324}")
    private String model;

    @Value("${lessonplan.ark.visionModel:}")
    private String visionModel;

    @Value("${lessonplan.ark.strictTemplate:true}")
    private boolean strictTemplate;

    @Value("${lessonplan.ark.strictHeadings:true}")
    private boolean strictHeadings;

    @Value("${lessonplan.ark.baseUrl:https://ark.cn-beijing.volces.com}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateLessonPlan(LessonPlanRequest req) {
        if (!StringUtils.hasText(apiKey)) {
            return mockLessonPlan(req);
        }

        String prompt = buildPrompt(req);

        if (StringUtils.hasText(req.getTemplateImage())) {
            String modelToUse = StringUtils.hasText(visionModel) ? visionModel : model;

            List<String> headings = Collections.emptyList();
            if (strictTemplate && strictHeadings) {
                headings = extractHeadingsFromTemplate(req.getTemplateImage(), modelToUse);
            }

            String promptWithHeadings = appendStrictHeadings(prompt, headings);
            try {
                String raw = callArkChatCompletions(buildMultimodalUserContent(promptWithHeadings, req.getTemplateImage()), modelToUse);
                if (strictTemplate) {
                    return enforceStrictTable(raw, req, modelToUse, headings);
                }
                return sanitizeHtml(raw);
            } catch (Exception ex) {
                String fallbackPrompt = promptWithHeadings + "\n\n【说明】图片输入可能不可用（模型不支持视觉/模型ID配置错误/图片过大等）。请在无法识别图片时，仍尽力用规范的教案表格样式输出。";

                String raw;
                try {
                    raw = callArkChatCompletions(fallbackPrompt, modelToUse);
                } catch (Exception ex2) {
                    if (!modelToUse.equals(model)) {
                        raw = callArkChatCompletions(fallbackPrompt, model);
                        modelToUse = model;
                    } else {
                        throw ex2;
                    }
                }

                if (strictTemplate) {
                    return enforceStrictTable(raw, req, modelToUse, headings);
                }
                return sanitizeHtml(raw);
            }
        }

        return sanitizeHtml(callArkChatCompletions(prompt, model));
    }

    private Object buildMultimodalUserContent(String prompt, String imageDataUrl) {
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("type", "text");
        textPart.put("text", prompt);

        Map<String, Object> imageUrl = new HashMap<>();
        imageUrl.put("url", imageDataUrl);

        Map<String, Object> imagePart = new HashMap<>();
        imagePart.put("type", "image_url");
        imagePart.put("image_url", imageUrl);

        return Arrays.asList(textPart, imagePart);
    }

    private String callArkChatCompletions(Object userContent, String modelToUse) {
        return callArkChatCompletions(userContent, modelToUse, SYSTEM_INSTRUCTION);
    }

    private String callArkChatCompletions(Object userContent, String modelToUse, String systemInstruction) {
        String url = baseUrl + "/api/v3/chat/completions";

        Map<String, Object> sysMsg = new HashMap<>();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemInstruction);

        Map<String, Object> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userContent);

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", modelToUse);
        payload.put("messages", Arrays.asList(sysMsg, userMsg));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        Object body = response.getBody();
        if (body == null) {
            return "";
        }
        if (!(body instanceof Map)) {
            return String.valueOf(body);
        }
        return extractContentFromChatCompletion((Map) body);
    }

    private String sanitizeHtml(String raw) {
        if (raw == null) {
            return "";
        }
        String cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```[a-zA-Z]*\\n?", "");
            cleaned = cleaned.replaceAll("```$", "");
            cleaned = cleaned.trim();
        }
        if (cleaned.toLowerCase().contains("<table")) {
            return ensureInlineTableBorders(cleaned);
        }
        return cleaned;
    }

    private String enforceStrictTable(String raw, LessonPlanRequest req, String modelToUse, List<String> headings) {
        String cleaned = sanitizeHtml(raw);
        String extracted = tryExtractTable(cleaned);
        if (StringUtils.hasText(extracted)) {
            return ensureInlineTableBorders(extracted);
        }

        StringBuilder fix = new StringBuilder();
        fix.append("你刚才的输出不符合要求。请严格按以下要求重写，并只返回最终 HTML：\n");
        fix.append("- 只允许返回一个 <table>...</table>，不能包含 <div>、<p>、<html>、说明文字。\n");
        fix.append("- 必须尽可能复刻参照图片的表格结构（行列/标题/合并单元格/分区）。\n");
        fix.append("- table/th/td 统一 border:1px solid #000; border-collapse:collapse; padding:8px 12px;\n");
        fix.append("- 单元格内可用 <br/> 换行。\n\n");
        if (headings != null && !headings.isEmpty()) {
            fix.append("- 表格中的大标题必须严格使用以下文字（顺序一致、原字不改）：");
            fix.append(String.join("、", headings));
            fix.append("\n\n");
        }
        fix.append("【输入信息】\n");
        fix.append("学科：").append(req.getSubject()).append("\n");
        fix.append("年级：").append(req.getGradeLevel()).append("\n");
        fix.append("主题：").append(req.getTopic()).append("\n");
        if (StringUtils.hasText(req.getDuration())) {
            fix.append("时长：").append(req.getDuration()).append("\n");
        }
        if (StringUtils.hasText(req.getObjectives())) {
            fix.append("学习目标：").append(req.getObjectives()).append("\n");
        }
        if (StringUtils.hasText(req.getAdditionalNotes())) {
            fix.append("补充要求：").append(req.getAdditionalNotes()).append("\n");
        }
        fix.append("\n【你上一次的输出（有问题）】\n");
        fix.append(cleaned);

        String repaired;
        try {
            if (StringUtils.hasText(req.getTemplateImage())) {
                repaired = callArkChatCompletions(buildMultimodalUserContent(fix.toString(), req.getTemplateImage()), modelToUse);
            } else {
                repaired = callArkChatCompletions(fix.toString(), modelToUse);
            }
        } catch (RestClientException ex) {
            return cleaned;
        }

        repaired = sanitizeHtml(repaired);
        String repairedExtracted = tryExtractTable(repaired);
        if (StringUtils.hasText(repairedExtracted)) {
            return ensureInlineTableBorders(repairedExtracted);
        }
        if (repaired != null && repaired.toLowerCase().contains("<table")) {
            return ensureInlineTableBorders(repaired);
        }
        return repaired;
    }

    private String ensureInlineTableBorders(String html) {
        String s = html;
        s = ensureTagHasStyle(s, "table", "border-collapse:collapse;border:1px solid #000;");
        s = ensureTagHasStyle(s, "th", "border:1px solid #000;padding:8px 12px;vertical-align:top;");
        s = ensureTagHasStyle(s, "td", "border:1px solid #000;padding:8px 12px;vertical-align:top;");
        return s;
    }

    private String ensureTagHasStyle(String html, String tag, String requiredStyle) {
        Pattern openTag = Pattern.compile("<" + tag + "(\\s[^>]*)?>", Pattern.CASE_INSENSITIVE);
        Matcher m = openTag.matcher(html);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String full = m.group(0);
            String attrs = m.group(1);
            String replaced = full;
            if (attrs == null) {
                replaced = "<" + tag + " style=\"" + requiredStyle + "\">";
            } else {
                replaced = applyRequiredStyle(tag, attrs, requiredStyle);
            }
            m.appendReplacement(sb, Matcher.quoteReplacement(replaced));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private String applyRequiredStyle(String tag, String attrsWithLeadingSpace, String requiredStyle) {
        String attrs = attrsWithLeadingSpace;
        String lower = attrs.toLowerCase();
        String required = requiredStyle;

        Pattern styleDq = Pattern.compile("style\\s*=\\s*\"([^\"]*)\"", Pattern.CASE_INSENSITIVE);
        Matcher mdq = styleDq.matcher(attrs);
        if (mdq.find()) {
            String existing = mdq.group(1);
            String existingLower = existing.toLowerCase();
            String extra = "";
            for (String part : required.split(";")) {
                String p = part.trim();
                if (!p.isEmpty()) {
                    String key = p.split(":")[0].trim();
                    if (!existingLower.contains(key)) {
                        extra += (existing.endsWith(";") || existing.isEmpty()) ? p + ";" : ";" + p + ";";
                    }
                }
            }
            String newStyle = existing + extra;
            String newAttrs = mdq.replaceFirst("style=\"" + Matcher.quoteReplacement(newStyle) + "\"");
            return "<" + tag + newAttrs + ">";
        }

        Pattern styleSq = Pattern.compile("style\\s*=\\s*'([^']*)'", Pattern.CASE_INSENSITIVE);
        Matcher msq = styleSq.matcher(attrs);
        if (msq.find()) {
            String existing = msq.group(1);
            String existingLower = existing.toLowerCase();
            String extra = "";
            for (String part : required.split(";")) {
                String p = part.trim();
                if (!p.isEmpty()) {
                    String key = p.split(":")[0].trim();
                    if (!existingLower.contains(key)) {
                        extra += (existing.endsWith(";") || existing.isEmpty()) ? p + ";" : ";" + p + ";";
                    }
                }
            }
            String newStyle = existing + extra;
            String newAttrs = msq.replaceFirst("style='" + Matcher.quoteReplacement(newStyle) + "'");
            return "<" + tag + newAttrs + ">";
        }

        if (lower.contains("style=")) {
            return "<" + tag + attrs + ">";
        }

        return "<" + tag + attrs + " style=\"" + required + "\">";
    }

    private String appendStrictHeadings(String prompt, List<String> headings) {
        if (headings == null || headings.isEmpty()) {
            return prompt;
        }
        StringBuilder sb = new StringBuilder(prompt);
        sb.append("\n\n【大标题锁定】\n");
        sb.append("请严格使用以下大标题文字（顺序一致、原字不改），并放在表格对应位置：\n");
        for (String h : headings) {
            sb.append("- ").append(h).append("\n");
        }
        return sb.toString();
    }

    private List<String> extractHeadingsFromTemplate(String imageDataUrl, String modelToUse) {
        String headingSystem = "你是一个文档表格结构与版式识别助手。";

        String headingPrompt = "请从用户提供的教案表格图片中识别【大标题/板块标题】（例如：教学目标、教学分析、教学重难点等）。\n" +
                "要求：\n" +
                "1) 仅输出 JSON 数组（string list），例如 [\"教学目标\",\"教学分析\"]\n" +
                "2) 保持图片中的原始文字，不要改写，不要添加解释\n" +
                "3) 按从上到下出现的顺序输出\n";

        try {
            String raw = callArkChatCompletions(buildMultimodalUserContent(headingPrompt, imageDataUrl), modelToUse, headingSystem);
            return parseJsonStringArray(raw);
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    private List<String> parseJsonStringArray(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Collections.emptyList();
        }
        String s = raw.trim();
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start < 0 || end < 0 || end <= start) {
            return Collections.emptyList();
        }
        String inside = s.substring(start + 1, end);
        String[] parts = inside.split(",");
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String p : parts) {
            String t = p.trim();
            if (t.startsWith("\"") && t.endsWith("\"")) {
                t = t.substring(1, t.length() - 1);
            }
            t = t.trim();
            if (StringUtils.hasText(t)) {
                set.add(t);
            }
        }
        return Arrays.asList(set.toArray(new String[0]));
    }

    private String tryExtractTable(String html) {
        if (!StringUtils.hasText(html)) {
            return "";
        }
        int start = indexOfIgnoreCase(html, "<table");
        int end = lastIndexOfIgnoreCase(html, "</table>");
        if (start >= 0 && end >= 0 && end > start) {
            return html.substring(start, end + "</table>".length()).trim();
        }
        String trimmed = html.trim();
        if (trimmed.toLowerCase().startsWith("<table") && trimmed.toLowerCase().endsWith("</table>")) {
            return trimmed;
        }
        return "";
    }

    private int indexOfIgnoreCase(String s, String sub) {
        return s.toLowerCase().indexOf(sub.toLowerCase());
    }

    private int lastIndexOfIgnoreCase(String s, String sub) {
        return s.toLowerCase().lastIndexOf(sub.toLowerCase());
    }

    private String extractContentFromChatCompletion(Map body) {
        Object choicesObj = body.get("choices");
        if (!(choicesObj instanceof List)) {
            return String.valueOf(body);
        }
        List choices = (List) choicesObj;
        if (choices.isEmpty()) {
            return "";
        }
        Object firstChoiceObj = choices.get(0);
        if (!(firstChoiceObj instanceof Map)) {
            return String.valueOf(body);
        }
        Map firstChoice = (Map) firstChoiceObj;
        Object messageObj = firstChoice.get("message");
        if (!(messageObj instanceof Map)) {
            return String.valueOf(body);
        }
        Map message = (Map) messageObj;
        Object contentObj = message.get("content");
        if (contentObj == null) {
            return String.valueOf(body);
        }
        return String.valueOf(contentObj);
    }

    private String buildPrompt(LessonPlanRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("请根据以下信息生成一份可直接使用的教案：\n");
        sb.append("学科：").append(req.getSubject()).append("\n");
        sb.append("年级：").append(req.getGradeLevel()).append("\n");
        sb.append("主题：").append(req.getTopic()).append("\n");
        if (StringUtils.hasText(req.getDuration())) {
            sb.append("时长：").append(req.getDuration()).append("\n");
        }
        if (StringUtils.hasText(req.getObjectives())) {
            sb.append("学习目标：").append(req.getObjectives()).append("\n");
        }
        if (StringUtils.hasText(req.getAdditionalNotes())) {
            sb.append("补充要求：").append(req.getAdditionalNotes()).append("\n");
        }

        sb.append("\n【格式要求】\n");
        sb.append("- 必须输出纯 HTML，不要 Markdown。\n");
        sb.append("- 结构清晰、排版美观、适合打印与导出 Word。\n");

        if (StringUtils.hasText(req.getTemplateImage())) {
            sb.append("\n【参照格式】用户上传了教案表格图片，请尽可能复刻该表格结构并填充内容。\n");
            sb.append("- 表格必须是 <table>，且 table/th/td 统一 border:1px solid #000; border-collapse:collapse;\n");
            sb.append("- 合并单元格（rowspan/colspan）尽量与参照一致。\n");
        } else {
            sb.append("\n【无参照格式】请输出美观的 HTML 页面：顶部标题 + 课程信息表格 + 分区块（浅灰背景）+ 列表。\n");
        }
        return sb.toString();
    }

    private String mockLessonPlan(LessonPlanRequest req) {
        String duration = StringUtils.hasText(req.getDuration()) ? req.getDuration() : "45分钟";
        return "【本地模式】未配置 ark.apiKey，返回模拟教案\n" +
                "年级：" + req.getGradeLevel() + "\n" +
                "学科：" + req.getSubject() + "\n" +
                "主题：" + req.getTopic() + "\n" +
                "时长：" + duration + "\n\n" +
                "一、教学目标\n" +
                "- 知识与技能：掌握本节课核心概念\n" +
                "- 过程与方法：通过示例与练习巩固\n" +
                "- 情感态度：激发学习兴趣\n\n" +
                "二、教学重难点\n" +
                "- 重点：核心概念理解\n" +
                "- 难点：迁移应用\n\n" +
                "三、教学过程（" + duration + "）\n" +
                "1. 导入（5分钟）\n" +
                "2. 新授（20分钟）\n" +
                "3. 练习（15分钟）\n" +
                "4. 总结与作业（5分钟）\n";
    }
}
