export default function StaticPage({ title }) {
  return (
    <div className="container-site py-20 min-h-[60vh]">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-8">{title}</h1>
      <div className="prose prose-lg max-w-3xl text-muted">
        <p>
          This is a placeholder page for <strong>{title}</strong>. In a full production application, 
          you would replace this content with the actual legal, policy, or company information.
        </p>
        <p>
          LYM|LYN is dedicated to providing high-quality essentials. Our terms, privacy policy, and return guidelines 
          are designed to ensure a smooth and transparent shopping experience.
        </p>
        <p>
          For any specific inquiries, please contact our support team.
        </p>
      </div>
    </div>
  );
}
