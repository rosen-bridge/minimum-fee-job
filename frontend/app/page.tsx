import { Suspense } from "react";

import Qr from "./Qr";
import Validations from "./Validations";

const Home = async () => {
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-16">
      <div className="border-2 border-solid border-blue-300 w-[48rem] h-64">
        <Suspense fallback="Loading prices...">
          <Validations />
        </Suspense>
      </div>
      <div className="border-2 border-solid border-black-300 w-96 h-96">
        <Suspense fallback="Loading tx...">
          <Qr />
        </Suspense>
      </div>
    </main>
  );
};

export default Home;
