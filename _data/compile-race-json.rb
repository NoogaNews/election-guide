# !/usr/bin/env ruby
#
# Converts *.csv to output files

require 'csv'
require 'json'

class SourceCSV
  attr_reader :collection
  
  def initialize(filename)
    lines       = CSV.open(filename).readlines
    keys        = lines.delete(lines.first)
    @collection = convert(lines, keys)
  end

  # Returns array of hashes
  def convert(lines, keys)
    array = Array.new
    
    lines.each do |line|
      zipped = keys.zip(line)
      
      # Filter value (Integer, Boolean, "" for nil, or String#strip)
      for pair in zipped
        value   = pair.pop 
        pair   << filter(value)
      end
      
      array << Hash[zipped]
    end

    return array
  end

  def filter(value)
    if value.nil?
      ""
    elsif value.to_i.to_s == value
      value.to_i
    elsif value == "true" || value == "false"
      (value == "true") ? true : false
    else
      value.strip
    end
  end

  # Merge child to parent by join_key under name
  # Parent : {name: [children]}
  def merge(child, join_key, name)    
    @collection.each do |m|
      recs = Array.new
      
      child.collection.each do |a|
        recs << a if a[join_key] == m[join_key]
      end

      m[name] = recs.empty? ? "" : recs
    end
  end

  def to_json(path, pretty=false)
    if pretty
      json = JSON.pretty_generate(@collection)
    else
      json = JSON.generate(@collection)
    end

    write_file(path, json)
  end

  def to_markdown(slug, dir)
    @collection.each do |hash|

      path = "#{dir}/#{hash[slug]}.md"
      
      data = front_matter
      data << "layout: candidate\n"
      hash.each { |key, value| data << "#{key}: #{value}\n"}
      data << front_matter

      write_file(path, data)
    end
  end

  def front_matter
    "---\n"
  end

  def write_file(path, data)
    file = File.open(path, 'w')
    file.puts(data)
    file.close
  end
end

# CSV files converted to arrays of key:value pairs
races = SourceCSV.new('november-races.csv')
candidates = SourceCSV.new('november-candidates.csv')
ballot_measures = SourceCSV.new('november-ballot-measures.csv')

# SourceCSV parent merged with SourceCSV child; third parameter is array name to add children
races.merge(candidates, "race_id", "candidates")
races.merge(ballot_measures, "race_id", "propositions")

# Write JSON
path = "#{Dir.pwd}/../api/races.json"
races.to_json(path, true)

## Write candidates/*.md profiles
md_path = "#{Dir.pwd}/../candidates"
candidates.to_markdown("name_slug", md_path)



