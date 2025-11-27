import Image from "next/image";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="Fraternal Admonition"
            width={120}
            height={120}
            className="opacity-90"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-serif text-[#222] mb-4">
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-[#666] text-lg mb-6 leading-relaxed">
          We're currently performing scheduled maintenance to improve your
          experience. Please check back soon.
        </p>

        {/* Footer message */}
        <div className="text-sm text-[#999] mt-8">
          Thank you for your patience.
        </div>
      </div>
    </div>
  );
}
