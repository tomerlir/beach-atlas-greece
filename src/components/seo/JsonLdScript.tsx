import { useMemo } from "react";

type JsonLdScriptProps = {
  schema: unknown;
  id?: string;
  className?: string;
};

const JsonLdScript = ({ schema, id, className }: JsonLdScriptProps) => {
  const json = useMemo(() => JSON.stringify(schema, null, 2), [schema]);

  return (
    <script
      id={id}
      className={className}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
};

export default JsonLdScript;
