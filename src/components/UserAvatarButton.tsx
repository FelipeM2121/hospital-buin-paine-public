export function UserAvatarButton() {
  return (
    <div style={{ padding: "8px 0 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 0.5,
          cursor: "default",
        }}
      >
        HBP
      </div>
    </div>
  );
}
