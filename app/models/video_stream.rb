require 'net/http'
require 'uri'
require 'json'

class VideoStream
  attr_reader :response

  def initialize()
    @response = self.build
  end

  def build
    uri = URI.parse("https://api.bcovlive.io/v1/jobs")
    request = Net::HTTP::Post.new(uri)
    binding.pry
    request.content_type = "application/json"
    request["X-Api-Key"] = ENV["CLIENT_SECRET"]
    request.body = JSON.dump({
      "live_sliding_window_duration" => 57600,
      "outputs" => [
        {
          "height" => 720,
          "video_bitrate" => 2100,
          "segment_seconds" => 4,
          "keyframe_interval" => 60,
          "width" => 1280,
          "video_codec" => "h264",
          "label" => "hls720p",
          "h264_profile" => "high",
          "live_stream" => true
        },
        {
          "height" => 540,
          "video_bitrate" => 1500,
          "segment_seconds" => 4,
          "keyframe_interval" => 60,
          "width" => 960,
          "video_codec" => "h264",
          "label" => "hls540p",
          "h264_profile" => "main",
          "live_stream" => true
        },
        {
          "height" => 360,
          "video_bitrate" => 800,
          "segment_seconds" => 4,
          "keyframe_interval" => 60,
          "width" => 640,
          "video_codec" => "h264",
          "label" => "hls360p",
          "h264_profile" => "main",
          "live_stream" => true
        }
      ],
      "region" => "ap-southeast-2",
      "reconnect_time" => 1800,
      "live_stream" => true
    })

    req_options = {
      use_ssl: uri.scheme == "https",
    }

    Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(request)
    end
  end
end
