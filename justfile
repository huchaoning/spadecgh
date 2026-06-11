build-cpp:
    mkdir -p cpp/build
    cmake -B cpp/build -S cpp/ -DCMAKE_BUILD_TYPE=Release
    cmake --build cpp/build --config Release
    cp cpp/lib/Release/* python/src/hducgh/assets/


clean-lib:
    rm -rf cpp/build cpp/lib


install:
    pip install -e ./python


uninstall:
    pip uninstall -e hducgh