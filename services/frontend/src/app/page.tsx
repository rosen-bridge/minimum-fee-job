'use client';

import { Qr, Validations } from '@/containers';

const Home = () => {
  return (
    <main className="flex flex-row p-8 gap-8">
      <div className="border-2 border-solid border-slate-300 shadow-xl rounded-2xl box-content grow">
        <Validations />
      </div>
      <div className="border-2 border-solid border-slate-300 shadow-xl rounded-2xl w-[380px] min-h-[380px] self-start  sticky top-8">
        <Qr />
      </div>
    </main>
  );
};

export default Home;
