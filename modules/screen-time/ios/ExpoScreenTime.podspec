require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoScreenTime'
  s.version        = package['version']
  s.summary        = 'FamilyControls + ManagedSettings bridge for React Native'
  s.description    = 'Expo native module that wraps Apple Screen Time APIs'
  s.homepage       = 'https://github.com/example/screen-time-module'
  s.license        = { type: 'MIT' }
  s.author         = 'Developer'
  s.source         = { git: '' }
  s.platform       = :ios, '16.0'
  s.swift_version  = '5.9'
  s.source_files   = '**/*.swift'

  s.dependency 'ExpoModulesCore'

  s.frameworks = 'FamilyControls', 'ManagedSettings', 'DeviceActivity'
end
