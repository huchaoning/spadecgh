build-cpp:
    mkdir -p cpp/build_py
    cmake -B cpp/build_py -S cpp/ -DCMAKE_BUILD_TYPE=Release
    cmake --build cpp/build_py --config Release


clean-cpp:
    rm -rf build
    rm -rf cpp/build_py cpp/lib
    rm -rf cpp/build_wasm web_app/public/wasm


build-wasm:
    mkdir -p cpp/build_wasm
    cd cpp/build_wasm && emcmake cmake ..
    cmake --build cpp/build_wasm


npm-install:
    cd web_app && npm install

npm-dev:
	cd web_app && npm run dev

npm-fix:
    cd web_app && npm audit fix


install:
    pip install -e ./python


uninstall:
    pip uninstall hducgh -y