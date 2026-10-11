import { Box } from '@mui/material';

type JsonSyntaxHighlighterProps = {
  content: unknown;
};

const TOKEN_REGEX =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?=\s*:))|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g;

export const JsonSyntaxHighlighter = ({
  content,
}: JsonSyntaxHighlighterProps) => {
  const json = JSON.stringify(content, null, 2) ?? '';
  const lines = json.split('\n');

  return (
    <Box
      sx={{
        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
        fontSize: '0.8125rem',
        lineHeight: 1.8,
      }}
    >
      {lines.map((line, lineIndex) => {
        const parts = [];
        let lastIndex = 0;

        for (const match of line.matchAll(TOKEN_REGEX)) {
          const index = match.index!;

          if (index > lastIndex) {
            parts.push(
              <span key={`plain-${lastIndex}`}>
                {line.slice(lastIndex, index)}
              </span>,
            );
          }

          const token = match[0];
          const color = match[1]
            ? '#79c0ff'
            : match[2]
              ? '#a5d6ff'
              : match[3]
                ? '#ff7b72'
                : '#d2a8ff';

          parts.push(
            <Box
              component="span"
              key={`token-${index}`}
              sx={{
                color,
                ...(match[1] && { color: '#7ee787' }),
                ...(match[2] && { color: '#a5d6ff' }),
                ...(match[3] && { color: '#ff7b72' }),
                ...(match[4] && { color: '#79c0ff' }),
              }}
            >
              {token}
            </Box>,
          );

          lastIndex = index + token.length;
        }

        if (lastIndex < line.length) {
          parts.push(
            <span key={`tail-${lastIndex}`}>{line.slice(lastIndex)}</span>,
          );
        }

        return (
          <Box key={lineIndex} sx={{ whiteSpace: 'pre' }}>
            {parts}
          </Box>
        );
      })}
    </Box>
  );
};
