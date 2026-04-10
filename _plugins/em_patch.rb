# Patch for EventMachine on Windows without C extensions or SortedSet (removed in Ruby 3+)
class SortedSet
  def initialize
    @arr = []
  end

  def add(item)
    @arr << item
    @arr.sort_by! { |x| x.first }
    self
  end

  def each(&block)
    @arr.each(&block)
  end

  def delete(item)
    @arr.delete(item)
  end

  def empty?
    @arr.empty?
  end

  def first
    @arr.first
  end

  def shift
    @arr.shift
  end
end

require 'em/pure_ruby'

if Gem.win_platform?
  module EventMachine
    class Selectable
      alias_method :orig_initialize, :initialize
      def initialize(io)
        @io = io
        @uuid = UuidGenerator.generate
        @is_server = false
        @last_activity = Reactor.instance.current_loop_time

        if defined?(Fcntl::F_GETFL)
          m = @io.fcntl(Fcntl::F_GETFL, 0)
          @io.fcntl(Fcntl::F_SETFL, Fcntl::O_NONBLOCK | m)
        else
          begin
            s = Socket.for_fd(@io.fileno)
            s.autoclose = false if s.respond_to?(:autoclose=)
            s.fcntl( Fcntl::F_SETFL, Fcntl::O_NONBLOCK )
          rescue Errno::EINVAL, Errno::EBADF
          end
        end

        @close_scheduled = false
        @close_requested = false

        se = self; @io.instance_eval { @my_selectable = se }
        Reactor.instance.add_selectable @io
      end
    end
  end
end
