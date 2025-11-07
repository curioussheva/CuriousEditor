import React, { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, TextInput } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
export interface EditorRef {
  setContent: (html: string) => void;
  getContent: () => Promise<string>;
  getText: () => Promise<string>;
  clearContent: () => void;
  formatText: (command: string, value?: string | null) => void;
  insertImage: (url: string, alt?: string) => void;
  createLink: (url: string, text?: string | null) => void;
  insertTable: (rows?: number, cols?: number) => void;
  insertCode: (language?: string) => void;
}

interface RichTextEditorProps {
  style?: any;
  onChange?: (html: string, text: string) => void;
  onEditorReady?: () => void;
  initialContent?: string;
  placeholder?: string;
  viewMode?: 'wysiwyg' | 'html' | 'markdown' | 'preview';
  settings?: {
    wordWrap?: boolean;
    showLineNumbers?: boolean;
    groupTags?: boolean;
  };
}

// Helper function to convert HTML to Markdown
const convertHTMLToMarkdown = (html: string): string => {
  // Hapus placeholder sebelum konversi
  const cleanHtml = html.replace(/<div class="placeholder">.*?<\/div>/, '');
  
  return cleanHtml
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
    .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<ul>(.*?)<\/ul>/gs, '$1')
    .replace(/<ol>(.*?)<\/ol>/gs, '$1')
    .replace(/<li>(.*?)<\/li>/g, '- $1\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

// Helper function to convert Markdown to HTML
const convertMarkdownToHTML = (markdown: string): string => {
  if (!markdown.trim()) return '';
  
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/\n<ul>/g, '</li><li>')
    .replace(/<\/ul>\n<ul>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/\n/g, '<br>');
};

const RichTextEditor = forwardRef<EditorRef, RichTextEditorProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [content, setContent] = useState(props.initialContent || '');
  const [viewMode, setViewMode] = useState<'wysiwyg' | 'html' | 'markdown' | 'preview'>(props.viewMode || 'wysiwyg');
  const [htmlContent, setHtmlContent] = useState(props.initialContent || '');
  const [markdownContent, setMarkdownContent] = useState(convertHTMLToMarkdown(props.initialContent || ''));
  const [lastWysiwygContent, setLastWysiwygContent] = useState(props.initialContent || '');

  // Apply settings
  const settings = props.settings || {};

  // Get placeholder text from props with fallback
  const placeholderText = props.placeholder || "Start typing...";

  // Sync content when view mode changes
  useEffect(() => {
    if (viewMode === 'wysiwyg' && editorReady && lastWysiwygContent) {
      // Inject content ke WebView ketika kembali ke WYSIWYG mode
      const escapedHtml = lastWysiwygContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      webViewRef.current?.injectJavaScript(`
        window.editorFunctions.setContent(\`${escapedHtml}\`);
        true;
      `);
    }
  }, [viewMode, editorReady]);

  // Create the editor HTML with proper placeholder
  const editorHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 16px;
            background-color: #ffffff;
            line-height: 1.6;
            color: #333333;
        }
        #editor {
            min-height: 400px;
            border: none;
            padding: 16px;
            font-size: 16px;
            outline: none;
            background-color: #ffffff;
        }
        #editor:focus {
            outline: none;
        }
        .placeholder {
            color: #999999;
            font-style: italic;
        }
        h1 { font-size: 24px; margin: 16px 0 8px 0; font-weight: bold; }
        h2 { font-size: 20px; margin: 14px 0 7px 0; font-weight: bold; }
        h3 { font-size: 18px; margin: 12px 0 6px 0; font-weight: bold; }
        p { margin: 8px 0; }
        ul, ol { margin: 8px 0 8px 24px; }
        blockquote {
            border-left: 4px solid #007AFF;
            padding-left: 16px;
            margin: 12px 0;
            color: #666666;
            font-style: italic;
        }
        code {
            background-color: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        pre {
            background-color: #f8f8f8;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 12px 0;
            font-family: 'Courier New', monospace;
            border: 1px solid #e0e0e0;
        }
        .code-block {
            background-color: #2d2d2d;
            color: #f8f8f2;
            padding: 16px;
            border-radius: 8px;
            margin: 12px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 8px 0;
        }
        a {
            color: #007AFF;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
        }
        table, th, td {
            border: 1px solid #e0e0e0;
        }
        th, td {
            padding: 8px 12px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div id="editor" contenteditable="true"></div>

<script>
  let isContentSet = false;

  const editorFunctions = {
    init: function() {
      this.setPlaceholder('${placeholderText.replace(/'/g, "\\'")}');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'editorReady'
      }));
    },

    updateContent: function() {
      const content = document.getElementById('editor').innerHTML;
      const text = document.getElementById('editor').innerText;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'contentChange',
        content: content,
        text: text
      }));
    },

    formatText: function(command, value = null) {
      console.log('Formatting:', command, value);
      try {
        // Handle special cases for block formatting
        if (command === 'formatBlock' && value) {
          document.execCommand('formatBlock', false, value);
        } 
        // Handle undo/redo
        else if (command === 'undo' || command === 'redo') {
          document.execCommand(command, false, null);
        }
        // Handle other commands with values
        else if (value !== null && value !== 'null') {
          document.execCommand(command, false, value);
        }
        // Handle commands without values
        else {
          document.execCommand(command, false, null);
        }
        
        this.updateContent();
        document.getElementById('editor').focus();
        
        console.log('Format successful:', command);
      } catch (error) {
        console.error('Format failed:', error);
        // Fallback for common issues
        if (command === 'strikeThrough') {
          document.execCommand('strikethrough', false, null);
          this.updateContent();
        }
      }
    },

    insertHTML: function(html) {
      try {
        document.execCommand('insertHTML', false, html);
        this.updateContent();
        document.getElementById('editor').focus();
      } catch (error) {
        console.error('Insert HTML error:', error);
        // Fallback: langsung set HTML di cursor position
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const div = document.createElement('div');
          div.innerHTML = html;
          const fragment = document.createDocumentFragment();
          while (div.firstChild) {
            fragment.appendChild(div.firstChild);
          }
          range.insertNode(fragment);
        }
        this.updateContent();
      }
    },

    setContent: function(html) {
      const editor = document.getElementById('editor');
      if (html && html.trim() !== '') {
        editor.innerHTML = html;
        isContentSet = true;
      } else {
        this.setPlaceholder('${placeholderText.replace(/'/g, "\\'")}');
      }
      this.updateContent();
    },

    getContent: function() {
      return document.getElementById('editor').innerHTML;
    },

    getText: function() {
      return document.getElementById('editor').innerText;
    },

    clearContent: function() {
      const editor = document.getElementById('editor');
      editor.innerHTML = '';
      isContentSet = false;
      this.setPlaceholder('${placeholderText.replace(/'/g, "\\'")}');
      this.updateContent();
    },

    setPlaceholder: function(text) {
      const editor = document.getElementById('editor');
      if (!editor.innerHTML.trim() && !isContentSet) {
        editor.innerHTML = '<div class="placeholder">' + text + '</div>';
      }
    },

    insertImage: function(url, alt = 'Image') {
      console.log('Inserting image:', url, alt);
      try {
        // Validate URL
        if (!url || url.trim() === '') {
          console.error('Invalid image URL');
          return;
        }
        
        // Create image HTML
        const imgHTML = '<img src="' + url + '" alt="' + alt + '" style="max-width:100%; height:auto; border-radius:6px; margin:8px 0;" />';
        console.log('Image HTML:', imgHTML);
        this.insertHTML(imgHTML);
        console.log('Image inserted successfully');
      } catch (error) {
        console.error('Insert image failed:', error);
      }
    },

    createLink: function(url, text = null) {
      console.log('Creating link:', url, text);
      try {
        // Validate URL
        if (!url || url.trim() === '') {
          console.error('Invalid URL');
          return;
        }
        
        if (text && text !== 'null') {
          // Create link with custom text
          const linkHTML = '<a href="' + url + '" target="_blank" style="color: #007AFF; text-decoration: none;">' + text + '</a>';
          console.log('Link HTML:', linkHTML);
          this.insertHTML(linkHTML);
        } else {
          // Use current selection for link text
          document.execCommand('createLink', false, url);
          this.updateContent();
        }
        console.log('Link created successfully');
      } catch (error) {
        console.error('Create link failed:', error);
      }
    },

    insertTable: function(rows = 3, cols = 3) {
      console.log('Inserting table:', rows, 'x', cols);
      try {
        let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #e0e0e0;">';
        for (let i = 0; i < rows; i++) {
          tableHTML += '<tr>';
          for (let j = 0; j < cols; j++) {
            tableHTML += '<td style="border: 1px solid #e0e0e0; padding: 8px;">&nbsp;</td>';
          }
          tableHTML += '</tr>';
        }
        tableHTML += '</table>';
        this.insertHTML(tableHTML);
        console.log('Table inserted successfully');
      } catch (error) {
        console.error('Insert table failed:', error);
      }
    },

    insertCode: function(language = 'javascript') {
      console.log('Inserting code block:', language);
      try {
        const codeHTML = '<pre class="code-block"><code class="language-' + language + '">// Your ' + language + ' code here\\nfunction example() {\\n  return "Hello World";\\n}</code></pre>';
        this.insertHTML(codeHTML);
        console.log('Code block inserted successfully');
      } catch (error) {
        console.error('Insert code failed:', error);
      }
    }
  };

  // Event listeners
  const editor = document.getElementById('editor');
  
  editor.addEventListener('input', () => editorFunctions.updateContent());
  editor.addEventListener('blur', () => editorFunctions.updateContent());
  editor.addEventListener('focus', function() {
    if (this.innerHTML.includes('placeholder')) {
      this.innerHTML = '';
      isContentSet = true;
    }
  });

  // Keyboard shortcuts for undo/redo
  editor.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editorFunctions.formatText('undo');
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        editorFunctions.formatText('redo');
      }
    }
  });

  // Initialize editor
  editorFunctions.init();

  // Expose to window
  window.editorFunctions = editorFunctions;
  
  // Debug: log ketika functions sudah tersedia
  console.log('Editor functions loaded successfully');
</script>
</body>
</html>
  `;

  useImperativeHandle(ref, () => ({
  setContent: (html: string) => {
    setContent(html);
    setHtmlContent(html);
    setMarkdownContent(convertHTMLToMarkdown(html));
    setLastWysiwygContent(html);
    
    if (editorReady) {
      const escapedHtml = html.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      webViewRef.current?.injectJavaScript(`
        window.editorFunctions.setContent(\`${escapedHtml}\`);
        true;
      `);
    }
  },
  getContent: (): Promise<string> => {
    return new Promise((resolve) => {
      if (viewMode === 'html') {
        resolve(htmlContent);
      } else if (viewMode === 'markdown') {
        resolve(convertMarkdownToHTML(markdownContent));
      } else {
        webViewRef.current?.injectJavaScript(`
          const content = window.editorFunctions.getContent();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'getContentResponse',
            content: content
          }));
          true;
        `);
      }
    });
  },
  getText: (): Promise<string> => {
    return new Promise((resolve) => {
      webViewRef.current?.injectJavaScript(`
        const text = window.editorFunctions.getText();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'getTextResponse', 
          text: text
        }));
        true;
      `);
    });
  },
  clearContent: () => {
    setContent('');
    setHtmlContent('');
    setMarkdownContent('');
    setLastWysiwygContent('');
    webViewRef.current?.injectJavaScript(`
      window.editorFunctions.clearContent();
      true;
    `);
  },
  formatText: (command: string, value: string | null = null) => {
    // Escape values untuk mencegah JavaScript error
    const escapedCommand = command.replace(/'/g, "\\'");
    const escapedValue = value ? value.replace(/'/g, "\\'") : null;
    
    const jsCode = `
      (function() {
        try {
          window.editorFunctions.formatText('${escapedCommand}', ${escapedValue ? `'${escapedValue}'` : 'null'});
          return true;
        } catch (error) {
          console.error('Format error:', error);
          return false;
        }
      })();
      true;
    `;
    
    console.log('Executing formatText:', command, value);
    webViewRef.current?.injectJavaScript(jsCode);
  },
  insertImage: (url: string, alt: string = 'Image') => {
    // Escape URL dan alt text
    const escapedUrl = url.replace(/'/g, "\\'").replace(/\n/g, "\\n");
    const escapedAlt = alt.replace(/'/g, "\\'").replace(/\n/g, "\\n");
    
    const jsCode = `
      (function() {
        try {
          window.editorFunctions.insertImage('${escapedUrl}', '${escapedAlt}');
          return true;
        } catch (error) {
          console.error('Insert image error:', error);
          return false;
        }
      })();
      true;
    `;
    
    console.log('Executing insertImage:', url);
    webViewRef.current?.injectJavaScript(jsCode);
  },
  createLink: (url: string, text: string | null = null) => {
    // Escape URL dan text
    const escapedUrl = url.replace(/'/g, "\\'").replace(/\n/g, "\\n");
    const escapedText = text ? text.replace(/'/g, "\\'").replace(/\n/g, "\\n") : null;
    
    const jsCode = `
      (function() {
        try {
          window.editorFunctions.createLink('${escapedUrl}', ${escapedText ? `'${escapedText}'` : 'null'});
          return true;
        } catch (error) {
          console.error('Create link error:', error);
          return false;
        }
      })();
      true;
    `;
    
    console.log('Executing createLink:', url, text);
    webViewRef.current?.injectJavaScript(jsCode);
  },
  insertTable: (rows: number = 3, cols: number = 3) => {
    webViewRef.current?.injectJavaScript(`
      window.editorFunctions.insertTable(${rows}, ${cols});
      true;
    `);
  },
  insertCode: (language: string = 'javascript') => {
    const escapedLanguage = language.replace(/'/g, "\\'");
    webViewRef.current?.injectJavaScript(`
      window.editorFunctions.insertCode('${escapedLanguage}');
      true;
    `);
  }
}));
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'editorReady':
          setEditorReady(true);
          props.onEditorReady?.();
          if (content) {
            const escapedHtml = content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
            webViewRef.current?.injectJavaScript(`
              window.editorFunctions.setContent(\`${escapedHtml}\`);
              true;
            `);
          }
          break;
        case 'contentChange':
          const cleanContent = data.content.replace(/<div class="placeholder">.*?<\/div>/, '');
          setContent(cleanContent);
          setHtmlContent(cleanContent);
          setMarkdownContent(convertHTMLToMarkdown(cleanContent));
          setLastWysiwygContent(cleanContent);
          props.onChange?.(cleanContent, data.text);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (newViewMode: 'wysiwyg' | 'html' | 'markdown' | 'preview') => {
    // Sync content sebelum ganti view mode
    if (viewMode === 'wysiwyg' && newViewMode !== 'wysiwyg') {
      // Simpan konten WYSIWYG terakhir
      webViewRef.current?.injectJavaScript(`
        const content = window.editorFunctions.getContent();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'contentChange',
          content: content,
          text: window.editorFunctions.getText()
        }));
        true;
      `);
    } else if (viewMode === 'html' && newViewMode === 'wysiwyg') {
      // Update WYSIWYG dengan konten HTML
      const escapedHtml = htmlContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      webViewRef.current?.injectJavaScript(`
        window.editorFunctions.setContent(\`${escapedHtml}\`);
        true;
      `);
      setLastWysiwygContent(htmlContent);
    } else if (viewMode === 'markdown' && newViewMode === 'wysiwyg') {
      // Update WYSIWYG dengan konten Markdown yang dikonversi
      const htmlFromMarkdown = convertMarkdownToHTML(markdownContent);
      const escapedHtml = htmlFromMarkdown.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      webViewRef.current?.injectJavaScript(`
        window.editorFunctions.setContent(\`${escapedHtml}\`);
        true;
      `);
      setLastWysiwygContent(htmlFromMarkdown);
    }
    
    setViewMode(newViewMode);
  };

  // Editable HTML View
  const renderHTMLView = () => (
    <View style={styles.codeContainer}>
      <Text style={styles.viewHelpText}>
        Edit HTML directly. Changes will be reflected in WYSIWYG view when you switch back.
      </Text>
      <TextInput
        style={[
          styles.codeInput,
          settings.wordWrap && styles.wordWrap,
          settings.showLineNumbers && styles.withLineNumbers
        ]}
        value={htmlContent}
        onChangeText={(text) => {
          setHtmlContent(text);
          setContent(text);
          props.onChange?.(text, text.replace(/<[^>]*>/g, ''));
        }}
        multiline
        textAlignVertical="top"
        placeholder="Edit your HTML content here..."
      />
    </View>
  );

  // Editable Markdown View
  const renderMarkdownView = () => (
    <View style={styles.codeContainer}>
      <Text style={styles.viewHelpText}>
        Edit Markdown directly. Changes will be reflected in WYSIWYG view when you switch back.
      </Text>
      <TextInput
        style={[
          styles.codeInput,
          settings.wordWrap && styles.wordWrap,
          settings.showLineNumbers && styles.withLineNumbers
        ]}
        value={markdownContent}
        onChangeText={(text) => {
          setMarkdownContent(text);
          const html = convertMarkdownToHTML(text);
          setContent(html);
          props.onChange?.(html, text);
        }}
        multiline
        textAlignVertical="top"
        placeholder="Edit your Markdown content here..."
      />
      <View style={styles.markdownPreview}>
        <Text style={styles.previewTitle}>Preview:</Text>
        <ScrollView style={styles.previewScroll}>
          <MarkdownDisplay style={markdownStyles}>
            {markdownContent}
          </MarkdownDisplay>
        </ScrollView>
      </View>
    </View>
  );

  // Markdown Preview Only
  const renderMarkdownPreview = () => (
    <ScrollView style={styles.previewView}>
      <MarkdownDisplay style={markdownStyles}>
        {markdownContent}
      </MarkdownDisplay>
    </ScrollView>
  );

  return (
    <View style={[styles.container, props.style]}>
      {/* View Mode Selector */}
      <View style={styles.viewModeSelector}>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'wysiwyg' && styles.activeViewMode]}
          onPress={() => handleViewModeChange('wysiwyg')}
        >
          <Text style={[styles.viewModeText, viewMode === 'wysiwyg' && styles.activeViewModeText]}>
            WYSIWYG
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'html' && styles.activeViewMode]}
          onPress={() => handleViewModeChange('html')}
        >
          <Text style={[styles.viewModeText, viewMode === 'html' && styles.activeViewModeText]}>
            HTML
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'markdown' && styles.activeViewMode]}
          onPress={() => handleViewModeChange('markdown')}
        >
          <Text style={[styles.viewModeText, viewMode === 'markdown' && styles.activeViewModeText]}>
            Markdown
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'preview' && styles.activeViewMode]}
          onPress={() => handleViewModeChange('preview')}
        >
          <Text style={[styles.viewModeText, viewMode === 'preview' && styles.activeViewModeText]}>
            Preview
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {viewMode === 'wysiwyg' && (
        <WebView
          ref={webViewRef}
          source={{ html: editorHTML }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      )}
      
      {viewMode === 'html' && renderHTMLView()}
      {viewMode === 'markdown' && renderMarkdownView()}
      {viewMode === 'preview' && renderMarkdownPreview()}
    </View>
  );
});

// ... keep your existing styles and markdownStyles ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeViewMode: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeViewModeText: {
    color: 'white',
  },
  codeContainer: {
    flex: 1,
    padding: 16,
  },
  codeInput: {
    flex: 1,
    fontFamily: 'Courier New',
    fontSize: 14,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  wordWrap: {
    textAlignVertical: 'top',
  },
  withLineNumbers: {
    paddingLeft: 40,
  },
  viewHelpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  markdownPreview: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  previewScroll: {
    flex: 1,
  },
  previewView: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 6,
    color: '#333',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#333',
  },
  paragraph: {
    marginVertical: 8,
  },
  list_item: {
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  link: {
    color: '#007AFF',
  },
  blockquote: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingLeft: 12,
    marginVertical: 8,
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    padding: 2,
    borderRadius: 3,
    fontFamily: 'Courier New',
  },
  code_block: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
};

export default RichTextEditor;