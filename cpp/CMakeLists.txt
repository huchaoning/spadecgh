cmake_minimum_required(VERSION 3.15)
project(hducgh_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/boost_math
    ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/nlohmann_json
)

if(EMSCRIPTEN)
    set(WASM_OUTDIR "${CMAKE_CURRENT_SOURCE_DIR}/../web_app/public/wasm")
    set(WASM_TARGET_NAME "hducgh_backend_web")

    add_executable(${WASM_TARGET_NAME} main_wasm.cpp)
    target_compile_options(${WASM_TARGET_NAME} PRIVATE -O3)

    set_target_properties(${WASM_TARGET_NAME} PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${WASM_OUTDIR}"
        SUFFIX ".js"
    )

    target_link_options(${WASM_TARGET_NAME} PRIVATE
        "-O3" "-sMODULARIZE=1" "-sEXPORT_ES6=1" "-sALLOW_MEMORY_GROWTH=1" "--bind"
    )

else()
    set(PY_OUTDIR "${CMAKE_CURRENT_SOURCE_DIR}/../python/src/hducgh/assets")

    if(WIN32)
        set(PLATFORM_NAME "win")
    elseif(APPLE)
        set(PLATFORM_NAME "macos")
    elseif(UNIX)
        set(PLATFORM_NAME "linux")
    endif()

    string(TOLOWER "${CMAKE_SYSTEM_PROCESSOR}" PROC)
    if(APPLE)
        set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64")
        set(ARCH_NAME "universal")
    else()
        if(PROC MATCHES "x86_64|amd64")
            set(ARCH_NAME "x64")
        elseif(PROC MATCHES "aarch64|arm64")
            set(ARCH_NAME "arm64")
        endif()
    endif()

    set(PY_TARGET_NAME "hducgh_backend_${PLATFORM_NAME}_${ARCH_NAME}")

    add_library(${PY_TARGET_NAME} SHARED main_py.cpp)

    set_target_properties(${PY_TARGET_NAME} PROPERTIES
        PREFIX ""
        LIBRARY_OUTPUT_DIRECTORY "${PY_OUTDIR}"
        RUNTIME_OUTPUT_DIRECTORY "${PY_OUTDIR}"
        LIBRARY_OUTPUT_DIRECTORY_RELEASE "${PY_OUTDIR}"
        RUNTIME_OUTPUT_DIRECTORY_RELEASE "${PY_OUTDIR}"
    )
endif()
