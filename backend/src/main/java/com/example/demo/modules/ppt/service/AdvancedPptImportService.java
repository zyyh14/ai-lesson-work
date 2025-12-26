package com.example.demo.service;

/**
 * PPTX -> Markdown 转换服务：
 * - 使用 Apache POI 遍历每页形状（文本、表格、图片、组合），按 Y 坐标排序保证阅读顺序。
 * - 识别标题、正文列表、表格、图片占位，并将备注写入 <!-- notes --> 注释。
 * - 单页容错：某一页解析失败仅跳过该页，其余页面继续解析，避免整份文档失败。
 */

import org.apache.poi.sl.usermodel.Placeholder;
import org.apache.poi.xslf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AdvancedPptImportService {
    private static final Logger log = LoggerFactory.getLogger(AdvancedPptImportService.class);

    public String convertPptToMarkdown(InputStream inputStream) {
        StringBuilder markdown = new StringBuilder();

        try (XMLSlideShow ppt = new XMLSlideShow(inputStream)) {
            List<XSLFSlide> slides = ppt.getSlides();
            if (slides.isEmpty()) {
                return "# 空演示文稿\n";
            }

            int index = 1;
            for (XSLFSlide slide : slides) {
                // --- 关键策略：单页容错 ---
                // 如果某一页解析崩了，捕获异常，跳过该页，继续解析下一页，防止“几十页只剩3页”
                try {
                    markdown.append(parseSingleSlide(slide, index));
                } catch (Exception e) {
                    log.error("Error parsing slide " + index, e);
                    markdown.append("# 第 ").append(index).append(" 页 (解析出错)\n")
                            .append("> ⚠️ 系统无法读取此页内容: ").append(e.getMessage()).append("\n\n---\n\n");
                }
                index++;
            }
        } catch (Exception e) {
            log.error("Fatal error parsing PPTX", e);
            return "# 导入失败\n无法读取文件，可能文件已损坏或加密。";
        }

        return markdown.toString().trim();
    }

    private String parseSingleSlide(XSLFSlide slide, int slideNumber) {
        String title = "";
        StringBuilder body = new StringBuilder();

        // 1. 获取所有形状 (包括组合内部的逻辑在递归里处理，这里先拿顶层的)
        List<XSLFShape> shapes = new ArrayList<>(slide.getShapes());
        
        // 2. 排序 (防止乱码)
        shapes.sort(Comparator.comparingDouble(s -> {
            if (s.getAnchor() == null) return 0.0;
            return s.getAnchor().getY();
        }));

        // 3. 递归提取内容
        for (XSLFShape shape : shapes) {
            ContentResult result = processShape(shape);
            
            // 尝试找标题
            if (title.isEmpty() && result.isTitle) {
                title = result.text;
            } else if (!result.text.isEmpty()) {
                // 只有当内容不是标题时，才加入正文
                if (!result.text.equals(title)) {
                    body.append(result.text);
                }
            }
        }

        // 4. 兜底标题
        if (title.isEmpty()) {
            if (slide.getTitle() != null && !slide.getTitle().trim().isEmpty()) {
                title = slide.getTitle();
            } else {
                title = "第 " + slideNumber + " 页";
            }
        }

        // 5. 提取备注
        String notes = extractNotes(slide);

        // 6. 组装结果
        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(title).append("\n\n");
        sb.append(body).append("\n");
        if (!notes.isEmpty()) {
            sb.append("<!-- notes\n").append(notes).append("\n-->\n");
        }
        sb.append("\n---\n\n");

        return sb.toString();
    }

    // --- 核心递归逻辑 ---
    
    // 用于返回处理结果的数据结构
    private static class ContentResult {
        String text = "";
        boolean isTitle = false;
        
        ContentResult(String text, boolean isTitle) {
            this.text = text;
            this.isTitle = isTitle;
        }
        
        static ContentResult empty() { return new ContentResult("", false); }
    }

    private ContentResult processShape(XSLFShape shape) {
        // A. 组合图形 (Group Shape) -> 递归！！！
        // 很多时候字和图都藏在这里面，之前的代码漏了这里
        if (shape instanceof XSLFGroupShape) {
            XSLFGroupShape group = (XSLFGroupShape) shape;
            StringBuilder groupContent = new StringBuilder();
            
            // 递归处理子形状
            List<XSLFShape> subShapes = new ArrayList<>(group.getShapes());
            // 组合内的也稍微排个序
            subShapes.sort(Comparator.comparingDouble(s -> s.getAnchor() != null ? s.getAnchor().getY() : 0));

            for (XSLFShape sub : subShapes) {
                ContentResult subResult = processShape(sub);
                groupContent.append(subResult.text);
            }
            return new ContentResult(groupContent.toString(), false);
        }

        // B. 文本框
        else if (shape instanceof XSLFTextShape) {
            XSLFTextShape textShape = (XSLFTextShape) shape;
            String rawText = textShape.getText();
            if (rawText == null || rawText.trim().isEmpty()) return ContentResult.empty();

            boolean looksLikeTitle = isTitle(textShape);
            
            // 格式化文本 (简单的列表处理)
            StringBuilder formatted = new StringBuilder();
            String[] lines = rawText.split("\n");
            for (String line : lines) {
                if (!line.trim().isEmpty()) {
                    if (looksLikeTitle) {
                        // 如果是标题，直接返回纯文本
                        return new ContentResult(line.trim(), true); 
                    } else {
                        formatted.append("- ").append(line.trim()).append("\n");
                    }
                }
            }
            return new ContentResult(formatted.toString(), false);
        }

        // C. 表格
        else if (shape instanceof XSLFTable) {
            XSLFTable table = (XSLFTable) shape;
            return new ContentResult(parseTable(table), false);
        }

        // D. 图片
        else if (shape instanceof XSLFPictureShape) {
            // 这里我们暂时只放占位符，不处理复杂的二进制提取
            return new ContentResult("\n![PPT插图 (占位)]\n", false);
        }

        return ContentResult.empty();
    }

    private String parseTable(XSLFTable table) {
        StringBuilder sb = new StringBuilder("\n");
        List<XSLFTableRow> rows = table.getRows();
        if (rows.isEmpty()) return "";

        for (int i = 0; i < rows.size(); i++) {
            XSLFTableRow row = rows.get(i);
            sb.append("|");
            for (XSLFTableCell cell : row.getCells()) {
                String val = cell.getText() == null ? " " : cell.getText().replace("\n", "<br>").trim();
                sb.append(" ").append(val.isEmpty() ? " " : val).append(" |");
            }
            sb.append("\n");
            // Header separator
            if (i == 0) {
                sb.append("|");
                for (int j = 0; j < row.getCells().size(); j++) {
                    sb.append("---|");
                }
                sb.append("\n");
            }
        }
        return sb.append("\n").toString();
    }

    private String extractNotes(XSLFSlide slide) {
        try {
            XSLFNotes notes = slide.getNotes();
            if (notes != null) {
                StringBuilder sb = new StringBuilder();
                for (XSLFTextShape shape : notes.getPlaceholders()) {
                    if (shape.getTextType() == Placeholder.BODY) {
                        sb.append(shape.getText()).append("\n");
                    }
                }
                return sb.toString().trim();
            }
        } catch (Exception e) {
            return "";
        }
        return "";
    }

    private boolean isTitle(XSLFTextShape shape) {
        // 1. Placeholder check
        if (shape.getTextType() == Placeholder.TITLE || shape.getTextType() == Placeholder.CENTERED_TITLE) {
            return true;
        }
        // 2. Position check (Top of slide)
        if (shape.getAnchor() != null && shape.getAnchor().getY() < 50) {
            return true;
        }
        // 3. Font size check
        try {
            if (!shape.getTextParagraphs().isEmpty()) {
                List<XSLFTextRun> runs = shape.getTextParagraphs().get(0).getTextRuns();
                if (!runs.isEmpty() && runs.get(0).getFontSize() != null && runs.get(0).getFontSize() > 24) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }
}