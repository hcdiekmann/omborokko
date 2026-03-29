import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export function EmailShell({
  preview,
  title,
  children,
}: {
  preview: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={hero}>
            <Text style={eyebrow}>Omborokko Safaris</Text>
            <Heading as="h1" style={titleStyle}>
              {title}
            </Heading>
          </Section>
          <Section style={content}>{children}</Section>
          <Hr style={divider} />
          <Text style={footer}></Text>
        </Container>
      </Body>
    </Html>
  );
}

export function DetailTable({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <Section style={detailCard}>
      {rows.map((row, index) => (
        <Section
          key={row.label}
          style={index === rows.length - 1 ? detailRowLast : detailRow}
        >
          <Text style={detailLabel}>{row.label}</Text>
          <Text style={detailValue}>{row.value}</Text>
        </Section>
      ))}
    </Section>
  );
}

const body = {
  margin: 0,
  backgroundColor: "#f7f2ea",
  fontFamily: "Arial, sans-serif",
  color: "#2c241b",
};

const container = {
  maxWidth: "640px",
  margin: "0 auto",
  padding: "28px 16px 40px",
};

const hero = {
  borderRadius: "28px",
  padding: "28px 32px",
  background: "linear-gradient(135deg, #1f2420 0%, #6a4727 55%, #b87d31 100%)",
  color: "#fff6ea",
};

const eyebrow = {
  margin: 0,
  fontSize: "12px",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "#f5d7aa",
  fontWeight: 700,
};

const titleStyle = {
  margin: "14px 0 0",
  fontSize: "34px",
  lineHeight: "1.05",
  fontWeight: 700,
  color: "#fffaf2",
};

const content = {
  padding: "24px 6px 8px",
};

const detailCard = {
  backgroundColor: "#fffdfa",
  border: "1px solid #e9dece",
  borderRadius: "22px",
  padding: "4px 18px",
};

const detailRow = {
  padding: "14px 0",
  borderBottom: "1px solid #efe6d8",
};

const detailRowLast = {
  padding: "14px 0",
};

const detailLabel = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "#8c6c49",
};

const detailValue = {
  margin: "6px 0 0",
  fontSize: "16px",
  lineHeight: "1.55",
  color: "#2c241b",
};

const divider = {
  borderColor: "#e7dccd",
  margin: "28px 0 18px",
};

const footer = {
  margin: 0,
  fontSize: "13px",
  lineHeight: "1.7",
  color: "#7f6951",
};
