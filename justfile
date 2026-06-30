ARCH := if os() == "macos" { "universal" } else { "x64" }

build-cpp:
    mkdir -p cpp/build_py
    cmake -B cpp/build_py -S cpp/ -DCMAKE_BUILD_TYPE=Release
    cmake --build cpp/build_py --config Release


clean:
    rm -rf build
    rm -rf cpp/build_py cpp/lib
    rm -rf cpp/build_wasm web_app/public/wasm
    rm -rf web_app/dist


build-wasm:
    mkdir -p cpp/build_wasm
    cd cpp/build_wasm && emcmake cmake -DCMAKE_BUILD_TYPE=Release .. && cmake --build .


build-app:
    cd web_app && BUILD_TARGET=electron npm run build && npx electron-builder --{{ARCH}}


npm-install:
    cd web_app && npm install


npm-ci:
    cd web_app && npm ci


run-dev:
    cd web_app && npm run dev -- --port 8888


run-build:
    cd web_app && npm run build


audit-fix:
    cd web_app && npm audit fix


install:
    pip install -e ./python


uninstall:
    pip uninstall hducgh -y


push:
    git add . && git commit -m "work in progress... | $(date '+%Y-%m-%d %H:%M:%S')" && git push


test:
    pytest -vv --log-cli-level=INFO