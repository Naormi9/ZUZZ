type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * Renders a JSON-LD <script> tag. Use in server components / layouts.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
