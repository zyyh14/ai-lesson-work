/**
 * Splits the markdown into slides using "---" as the delimiter.
 * Handles the case where "---" might be used for horizontal rules within a slide loosely,
 * but generally assumes "---" on its own line is a slide separator.
 */
export const splitSlides = (markdown: string): string[] => {
    // Split by line containing only "---" (ignoring whitespace)
    return markdown.split(/\n\s*---\s*\n/);
};
  
/**
 * Joins slides back into a single markdown string.
 */
export const joinSlides = (slides: string[]): string => {
    return slides.join('\n\n---\n\n');
};
  
/**
 * Updates the content of a specific slide by index.
 */
export const updateSlideAtIndex = (currentMarkdown: string, index: number, newContent: string): string => {
    const slides = splitSlides(currentMarkdown);
    if (index >= 0 && index < slides.length) {
        slides[index] = newContent.trim();
        return joinSlides(slides);
    }
    return currentMarkdown;
};
  
/**
 * Appends a new slide to the end.
 */
export const appendSlide = (currentMarkdown: string, content: string): string => {
    const slides = splitSlides(currentMarkdown);
    slides.push(content.trim());
    return joinSlides(slides);
};
  
/**
 * Inserts a new slide at a specific index.
 */
export const insertSlide = (currentMarkdown: string, index: number, content: string): string => {
    const slides = splitSlides(currentMarkdown);
    if (index < 0) index = 0;
    if (index > slides.length) index = slides.length;
    
    slides.splice(index, 0, content.trim());
    return joinSlides(slides);
};

/**
 * Reads the content of a specific slide.
 */
export const getSlideContent = (currentMarkdown: string, index: number): string => {
    const slides = splitSlides(currentMarkdown);
    if (index >= 0 && index < slides.length) {
        return slides[index];
    }
    return "";
};

/**
 * Replaces the entire markdown content (Pass-through for AI consistency).
 */
export const updateFullMarkdown = (newMarkdown: string): string => {
    return newMarkdown;
};
