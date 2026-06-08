cmake_minimum_required(VERSION 3.15)
project(cgh_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
    cpp
    cpp/third_party/boost_math
    cpp/third_party/nlohmann_json
)

add_library(cgh_engine SHARED cpp/cgh_engine.cpp)

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