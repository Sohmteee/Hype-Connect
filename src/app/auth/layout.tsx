import { BackgroundMoneyWave } from '@/components/BackgroundMoneyWave';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BackgroundMoneyWave />
      <div className="relative z-10">
        {children}
      </div>
    </>
  );
}
