cmake_minimum_required(VERSION 3.15)
project(hducgh_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

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

set(TARGET_NAME "hducgh_backend_${PLATFORM_NAME}_${ARCH_NAME}")



include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/boost_math
    ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/nlohmann_json
)

add_library(${TARGET_NAME} SHARED main.cpp)

set_target_properties(${TARGET_NAME} PROPERTIES PREFIX "")

set_target_properties(${TARGET_NAME} PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/lib"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/lib"
)
