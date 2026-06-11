cmake_minimum_required(VERSION 3.15)
project(cgh_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(APPLE)
    set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64")
endif()

include_directories(
    .
    third_party/boost_math
    third_party/nlohmann_json
)

add_library(cgh_engine SHARED cgh_engine.cpp)

set_target_properties(cgh_engine PROPERTIES PREFIX "")

set_target_properties(cgh_engine PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/lib"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/lib"
)

foreach(OUTPUTCONFIG ${CMAKE_CONFIGURATION_TYPES})
    string(TOUPPER ${OUTPUTCONFIG} CONFIG)
    set_target_properties(cgh_engine PROPERTIES
        LIBRARY_OUTPUT_DIRECTORY_${CONFIG} "${CMAKE_CURRENT_SOURCE_DIR}/lib"
        RUNTIME_OUTPUT_DIRECTORY_${CONFIG} "${CMAKE_CURRENT_SOURCE_DIR}/lib"
    )
endforeach()