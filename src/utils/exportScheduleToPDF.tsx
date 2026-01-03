// src/utils/exportScheduleToPDF.tsx
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ScheduleByClass } from '@/types/schedule.types';

// Custom F4 size in points (21.5 cm x 33 cm)
// 1 cm = 28.3465 points approximately
// Width: 21.5 cm ≈ 609 points
// Height: 33 cm ≈ 936 points
const F4_SIZE = { width: 609, height: 936 };

// Styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 15, // Reduced padding to fit more content
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    borderBottom: '2 solid #4F46E5',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16, // Slightly reduced for space
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderRow: {
    backgroundColor: '#F3F4F6',
  },
  tableCell: {
    padding: 6, // Slightly reduced padding
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minHeight: 65, // Adjusted for space
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  dayCell: {
    width: '20%', // 100% / 5 days
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 9,
    textAlign: 'center',
  },
  nonJpCell: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  tetapCell: {
    backgroundColor: '#E9D5FF',
    borderColor: '#A855F7',
  },
  normalCell: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  emptyCell: {
    backgroundColor: '#F9FAFB',
  },
  cellContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: 1, // Reduced gap
  },
  blockName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
  timeText: {
    fontSize: 6,
    color: '#6B7280',
    fontFamily: 'Courier',
    lineHeight: 1.1,
  },
  subjectText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 1.2,
  },
  teacherText: {
    fontSize: 7,
    color: '#4B5563',
    lineHeight: 1.1,
  },
  emptyText: {
    fontSize: 7,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 7,
    color: '#4B5563',
    fontWeight: 'bold',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    fontSize: 8,
    color: '#9CA3AF',
  },
});

// PDF Document Component
const SchedulePDFDocument: React.FC<{ schedules: ScheduleByClass[] }> = ({ schedules }) => {
  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  return (
    <Document>
      {schedules.map((classSchedule, classIdx) => (
        <Page key={classIdx} size={F4_SIZE} style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Jadwal Pelajaran - {classSchedule.kelas_nama}
            </Text>
            {classSchedule.tingkat && (
              <Text style={styles.subtitle}>Tingkat {classSchedule.tingkat}</Text>
            )}
          </View>

          {/* Get all unique time slots */}
          {(() => {
            const uniqueTimeSlots = new Map<number, any>();
            
            classSchedule.days.forEach(day => {
              day.slots.forEach(slot => {
                const key = slot.urutan;
                if (!uniqueTimeSlots.has(key)) {
                  uniqueTimeSlots.set(key, slot);
                }
              });
            });

            const sortedTimeSlots = Array.from(uniqueTimeSlots.values())
              .sort((a, b) => a.urutan - b.urutan);

            // Filter active days
            const activeDays = classSchedule.days.filter(d => d.slots.length > 0);

            return (
              <View style={styles.table}>
                {/* Header Row */}
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {activeDays.map((day, idx) => (
                    <View 
                      key={day.hari} 
                      style={[
                        styles.tableCell, 
                        styles.dayCell, 
                        styles.headerCell,
                        idx === activeDays.length - 1 && styles.tableCellLast
                      ]}
                    >
                      <Text>{day.hari}</Text>
                    </View>
                  ))}
                </View>

                {/* Data Rows */}
                {sortedTimeSlots.map((timeSlot, rowIdx) => (
                  <View key={rowIdx} style={styles.tableRow}>
                    {/* Day Columns */}
                    {activeDays.map((day, dayIdx) => {
                      const slot = day.slots.find(s => s.urutan === timeSlot.urutan);

                      let cellStyle = [styles.tableCell, styles.dayCell];
                      let content;

                      if (dayIdx === activeDays.length - 1) {
                        cellStyle.push(styles.tableCellLast);
                      }

                      if (!slot) {
                        cellStyle.push(styles.emptyCell);
                        content = <Text style={styles.emptyText}>-</Text>;
                      } else {
                        // Non-JP
                        if (slot.type === 'non-jp') {
                          cellStyle.push(styles.nonJpCell);
                          content = (
                            <View style={styles.cellContent}>
                              <Text style={styles.blockName}>{slot.nama_block}</Text>
                              <Text style={styles.timeText}>
                                {slot.jam_mulai.slice(0, 5)} - {slot.jam_selesai.slice(0, 5)}
                              </Text>
                            </View>
                          );
                        }
                        // JP Tetap
                        else if (slot.type === 'jp-tetap' && slot.mapel_tetap) {
                          cellStyle.push(styles.tetapCell);
                          content = (
                            <View style={styles.cellContent}>
                              <Text style={styles.blockName}>{slot.nama_block}</Text>
                              <Text style={styles.timeText}>
                                {slot.jam_mulai.slice(0, 5)} - {slot.jam_selesai.slice(0, 5)}
                              </Text>
                              <Text style={styles.subjectText}>{slot.mapel_tetap.mapel_nama}</Text>
                              <Text style={styles.teacherText}>{slot.mapel_tetap.guru_nama}</Text>
                            </View>
                          );
                        }
                        // JP Biasa
                        else if (slot.type === 'jp-biasa' && slot.jadwal_slot) {
                          cellStyle.push(styles.normalCell);
                          content = (
                            <View style={styles.cellContent}>
                              <Text style={styles.blockName}>{slot.nama_block}</Text>
                              <Text style={styles.timeText}>
                                {slot.jam_mulai.slice(0, 5)} - {slot.jam_selesai.slice(0, 5)}
                              </Text>
                              <Text style={styles.subjectText}>{slot.jadwal_slot.mapel_nama}</Text>
                              <Text style={styles.teacherText}>{slot.jadwal_slot.guru_nama}</Text>
                            </View>
                          );
                        }
                        // Empty JP slot
                        else {
                          cellStyle.push(styles.emptyCell);
                          content = (
                            <View style={styles.cellContent}>
                              <Text style={styles.blockName}>{slot.nama_block}</Text>
                              <Text style={styles.timeText}>
                                {slot.jam_mulai.slice(0, 5)} - {slot.jam_selesai.slice(0, 5)}
                              </Text>
                              <Text style={styles.emptyText}>Kosong</Text>
                            </View>
                          );
                        }
                      }

                      return (
                        <View key={day.hari} style={cellStyle}>
                          {content}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]} />
              <Text style={styles.legendText}>Non-JP</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#E9D5FF', borderColor: '#A855F7' }]} />
              <Text style={styles.legendText}>JP Tetap</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>JP Biasa (GA)</Text>
            </View>
          </View>

          {/* Page Number */}
          <Text style={styles.pageNumber}>
            Halaman {classIdx + 1} dari {schedules.length}
          </Text>
        </Page>
      ))}
    </Document>
  );
};

/**
 * Export schedule to PDF
 * @param schedules - Array of schedule by class
 * @param filename - Output filename (default: Jadwal.pdf)
 */
export const exportScheduleToPDF = async (
  schedules: ScheduleByClass[],
  filename: string = 'Jadwal.pdf'
): Promise<void> => {
  try {
    const blob = await pdf(<SchedulePDFDocument schedules={schedules} />).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Gagal export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};