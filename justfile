build-cpp:
    mkdir -p cpp/build
    cmake -B cpp/build -S cpp/ -DCMAKE_BUILD_TYPE=Release
    cmake --build cpp/build --config Release
    cp cpp/lib/* python/src/hducgh/assets/


clean-cpp:
    rm -rf cpp/build cpp/lib build


install:
    pip install -e ./python


uninstall:
    pip uninstall hducgh -y