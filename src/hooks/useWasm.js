import { useState, useEffect } from 'react';

const useWasm = () => {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 检查全局变量 InitModule 是否存在（由 index.html 里的脚本提供）
    if (typeof window.InitModule !== 'function') {
      const err = "InitModule not found. Check if /wasm/cgh_wasm.js is loaded in index.html";
      console.error(err);
      setError(err);
      setLoading(false);
      return;
    }

    // 初始化 Wasm 模块
    window.InitModule()
      .then((instance) => {
        console.log("Wasm Engine Ready!");
        setModule(instance);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Wasm initialization failed:", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  return { module, loading, error };
};

export default useWasm;