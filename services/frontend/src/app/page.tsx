'use client';

import { Qr, Validations } from '@/containers';

const Home = () => {
  return (
    <main className="flex flex-row items-center justify-center h-screen gap-16">
      <div className="border-2 border-solid border-slate-300 shadow-xl rounded-2xl w-[60vw] min-h-[380px] max-h-[80vh] box-content">
        <Validations />
      </div>
      <div className="border-2 border-solid border-slate-300 shadow-xl rounded-2xl w-[380px] min-h-[380px]">
        <Qr />
      </div>
    </main>
  );
};

export default Home;
