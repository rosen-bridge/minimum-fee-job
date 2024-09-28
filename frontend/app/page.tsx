import { Suspense } from "react";

import Qr from "./_components/qrcode/Qr";
import Validations from "./Validations";

const Home = () => {
  return (
    <main className="flex flex-row items-center justify-center h-screen gap-16">
      <div className="border-2 border-solid border-blue-300 w-[48rem] max-h-[80vh]">
        <Suspense fallback="Loading prices...">
          <Validations />
        </Suspense>
      </div>
      <div className="border-4 border-solid rounded border-blue-500">
        <Suspense fallback="Loading tx...">
          <Qr />
        </Suspense>
      </div>
    </main>
  );
};

export default Home;
