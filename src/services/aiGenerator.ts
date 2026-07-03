import type { TaskType, TaskModel, TaskOutput } from '../types/task';

export function generateMockAiOutput(
  type: TaskType,
  model: TaskModel,
  input: { prompt?: string; content?: string; targetLanguage?: string }
): TaskOutput {
  const prompt = input.prompt || input.content || 'Sample Input';
  const start = Date.now();

  switch (type) {
    case 'summarization': {
      const resultText = `### Executive Summary & Key Takeaways\n\n` +
        `**Overview:** Analysis of input context (${prompt.slice(0, 60)}...) reveals three key operational insights.\n\n` +
        `#### Key Highlights:\n` +
        `1. **System Throughput:** Asynchronous task processing architecture increases total queue capacity by 340%.\n` +
        `2. **Resource Optimization:** Distributed worker polling prevents database lock contention during high-burst events.\n` +
        `3. **Fault Tolerance:** Built-in exponential backoff retry mechanisms reduce transient network drop errors down to <0.02%.\n\n` +
        `**Sentiment Score:** 0.88 (Strong Positive) | **Readability:** Grade 12 | **Compression Ratio:** 76% reduction`;

      return {
        resultText,
        jsonResult: {
          sentiment: 'Positive',
          confidence: 0.94,
          keyTopics: ['Architecture', 'Throughput', 'Fault Tolerance'],
          wordCountOriginal: prompt.split(' ').length || 240,
          wordCountSummary: 65,
        },
        metrics: {
          tokenUsage: 482,
          promptTokens: 310,
          completionTokens: 172,
          costEstimate: 0.0014,
          latencyMs: Date.now() - start + 1200,
        },
      };
    }

    case 'code_audit': {
      const codeSnippet = `// Optimized & Refactored Implementation
import { useMemo, useCallback } from 'react';

export function TaskQueueMonitor({ tasks, onRetry }: TaskQueueMonitorProps) {
  // Memoized active worker load to prevent unneeded re-renders
  const activeLoad = useMemo(() => {
    return tasks.filter(t => t.status === 'processing').length;
  }, [tasks]);

  const handleBatchRetry = useCallback((ids: string[]) => {
    ids.forEach(id => onRetry(id));
  }, [onRetry]);

  return (
    <div className="glass-panel p-4 rounded-xl border border-blue-500/20">
      <h3 className="text-sm font-semibold text-blue-400">Active Load: {activeLoad}</h3>
    </div>
  );
}`;

      const resultText = `### Code Audit & Vulnerability Assessment Report\n\n` +
        `**Model Assessor:** \`${model}\` | **Audit Score:** 94/100 (Pass)\n\n` +
        `#### Identified Improvements:\n` +
        `- ✅ **Security:** Zero SQL injection or unescaped HTML vulnerabilities detected.\n` +
        `- ⚡ **Performance:** Replaced unnecessary re-renders with \`useMemo\` and \`useCallback\` hooks.\n` +
        `- 🛡️ **Type Safety:** Added strict TypeScript interface definitions for props and handlers.`;

      return {
        resultText,
        codeSnippet,
        language: 'typescript',
        jsonResult: {
          auditScore: 94,
          vulnerabilities: [],
          suggestionsCount: 3,
          timeComplexity: 'O(N)',
          memoryUsage: 'Optimal',
        },
        metrics: {
          tokenUsage: 740,
          promptTokens: 420,
          completionTokens: 320,
          costEstimate: 0.0028,
          latencyMs: Date.now() - start + 1850,
        },
      };
    }

    case 'entity_extraction': {
      const entities = [
        { name: 'Google Cloud Platform', type: 'ORGANIZATION', confidence: 0.99 },
        { name: 'Kubernetes Cluster', type: 'INFRASTRUCTURE', confidence: 0.97 },
        { name: 'Redis Cache', type: 'DATABASE', confidence: 0.96 },
        { name: 'Greater Noida', type: 'LOCATION', confidence: 0.98 },
        { name: '$45,000 USD', type: 'MONEY', confidence: 0.95 },
        { name: '2026-07-15', type: 'DATE', confidence: 0.99 },
      ];

      return {
        resultText: `Successfully extracted ${entities.length} named entities with average confidence of 97.3%.`,
        entities,
        jsonResult: {
          entities,
          sourceLength: prompt.length,
          extractedAt: new Date().toISOString(),
        },
        metrics: {
          tokenUsage: 360,
          promptTokens: 210,
          completionTokens: 150,
          costEstimate: 0.0009,
          latencyMs: Date.now() - start + 980,
        },
      };
    }

    case 'image_gen': {
      // Sleek AI image placeholder URL (using Unsplash high-tech AI render)
      const imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
      return {
        resultText: `Generated high-fidelity image based on prompt: "${prompt}" using model \`${model}\`. Resolution: 1024x1024. Sampling steps: 30.`,
        imageUrl,
        jsonResult: {
          prompt,
          seed: Math.floor(Math.random() * 99999999),
          dimensions: '1024x1024',
          steps: 30,
          cfgScale: 7.5,
        },
        metrics: {
          tokenUsage: 120,
          promptTokens: 120,
          completionTokens: 0,
          costEstimate: 0.0120,
          latencyMs: Date.now() - start + 3200,
        },
      };
    }

    case 'translation': {
      const targetLang = input.targetLanguage || 'Spanish';
      const resultText = `### Translation Output (${targetLang})\n\n` +
        `**Original:** "${prompt}"\n\n` +
        `**Translated (${targetLang}):** "Plataforma de procesamiento de tareas de IA escalable con monitoreo en tiempo real, colas asincrónicas y tolerancia a fallos."\n\n` +
        `**Grammar Accuracy:** 99.1% | **Glossary Alignment:** Match Verified`;

      return {
        resultText,
        jsonResult: {
          sourceLanguage: 'English',
          targetLanguage: targetLang,
          accuracyScore: 0.991,
          translatedText: 'Plataforma de procesamiento de tareas de IA escalable con monitoreo en tiempo real, colas asincrónicas y tolerancia a fallos.',
        },
        metrics: {
          tokenUsage: 240,
          promptTokens: 140,
          completionTokens: 100,
          costEstimate: 0.0006,
          latencyMs: Date.now() - start + 850,
        },
      };
    }

    case 'uppercase': {
      const resultText = `### Uppercase Operation Output\n\n` +
        `**Original Text:** "${prompt}"\n\n` +
        `**Converted Output:**\n` +
        `\`\`\`\n` +
        prompt.toUpperCase() +
        `\n\`\`\``;

      return {
        resultText,
        jsonResult: { original: prompt, converted: prompt.toUpperCase(), operation: 'UPPERCASE' },
        metrics: { tokenUsage: 85, promptTokens: 45, completionTokens: 40, costEstimate: 0.0002, latencyMs: Date.now() - start + 450 },
      };
    }

    case 'lowercase': {
      const resultText = `### Lowercase Operation Output\n\n` +
        `**Original Text:** "${prompt}"\n\n` +
        `**Converted Output:**\n` +
        `\`\`\`\n` +
        prompt.toLowerCase() +
        `\n\`\`\``;

      return {
        resultText,
        jsonResult: { original: prompt, converted: prompt.toLowerCase(), operation: 'LOWERCASE' },
        metrics: { tokenUsage: 85, promptTokens: 45, completionTokens: 40, costEstimate: 0.0002, latencyMs: Date.now() - start + 450 },
      };
    }

    case 'reverse': {
      const reversed = prompt.split('').reverse().join('');
      const resultText = `### Reverse Operation Output\n\n` +
        `**Original Text:** "${prompt}"\n\n` +
        `**Reversed Output:**\n` +
        `\`\`\`\n` +
        reversed +
        `\n\`\`\``;

      return {
        resultText,
        jsonResult: { original: prompt, reversed, operation: 'REVERSE' },
        metrics: { tokenUsage: 90, promptTokens: 50, completionTokens: 40, costEstimate: 0.0002, latencyMs: Date.now() - start + 500 },
      };
    }

    case 'word_count': {
      const words = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
      const chars = prompt.length;
      const sentences = prompt.split(/[.!?]+/).filter(Boolean).length;
      const resultText = `### Word Count Analytics Report\n\n` +
        `**Analyzed Context:** "${prompt.slice(0, 60)}..."\n\n` +
        `- 📝 **Word Count:** ${words} words\n` +
        `- 🔤 **Character Count:** ${chars} characters\n` +
        `- 📄 **Sentence Count:** ${sentences} sentences\n` +
        `- ⏱️ **Est. Reading Time:** ${(words / 200).toFixed(2)} min`;

      return {
        resultText,
        jsonResult: { words, chars, sentences, readingTimeMinutes: (words / 200).toFixed(2) },
        metrics: { tokenUsage: 110, promptTokens: 60, completionTokens: 50, costEstimate: 0.0003, latencyMs: Date.now() - start + 600 },
      };
    }

    default: {
      const resultText = `### AI Task Response\n\n` +
        `Task processed successfully by **${model}**.\n\n` +
        `\`\`\`json\n` +
        JSON.stringify({ prompt, timestamp: new Date().toISOString(), status: 'SUCCESS' }, null, 2) +
        `\n\`\`\``;

      return {
        resultText,
        jsonResult: { status: 'SUCCESS', prompt },
        metrics: {
          tokenUsage: 410,
          promptTokens: 250,
          completionTokens: 160,
          costEstimate: 0.0012,
          latencyMs: Date.now() - start + 1100,
        },
      };
    }
  }
}
